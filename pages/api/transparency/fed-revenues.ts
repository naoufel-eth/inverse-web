import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI, XCHAIN_FED_ABI } from '@app/config/abis'
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { getTransfers } from '@app/util/covalent';
import { parseUnits } from '@ethersproject/units';

export default async function handler(req, res) {

    const { DOLA, FEDS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);
    const ftmConfig = getNetworkConfig(NetworkIds.ftm, false);
    const cacheKey = `revenues-v1.0.0`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 300);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const feds = FEDS.filter(fed => fed.chainId === NetworkIds.mainnet);

        // const transfers = await Promise.all([
        //     ...feds.map((fed: Fed) => {
        //         const provider = getProvider(fed.chainId, undefined, true);
        //         const dolaContract = new Contract(fed.chainId === NetworkIds.mainnet ? DOLA : ftmConfig?.DOLA!, DOLA_ABI, provider);
        //         if (fed.isXchain) {
        //             // const fedContract = new Contract(fed.address, XCHAIN_FED_ABI, provider);
        //             return dolaContract.queryFilter(dolaContract.filters.LogSwapout(fed.address, TREASURY));
        //         } else {
        //             // const dolaContract = new Contract(fed.chainId === NetworkIds.mainnet ? DOLA : ftmConfig?.DOLA!, DOLA_ABI, provider);
        //             return dolaContract.queryFilter(dolaContract.filters.Transfer(fed.address, TREASURY));
        //         }
        //     }),
        // ]);

        const transfers = await Promise.all(
            feds.map(fed => getTransfers(fed.isXchain ? ftmConfig?.DOLA! :  DOLA, fed.address, 1000, 0, fed.chainId))
        )

        const filteredTransfers = transfers.map((r, i) => {
            const fed = feds[i];
            const toAddress = fed.isXchain ? 'null' : TREASURY.toLowerCase();  

            const items = r.data.items
                .filter(item => item.successful)
                .filter(item => !!item.transfers.find(t => (t.to_address||'null')?.toLowerCase() === toAddress))
                .sort((a, b) => a.block_height - b.block_height);

                return items.map(item => {
                    const filtered = item.transfers.find(t => (t.to_address||'null')?.toLowerCase() === toAddress)
                    return {
                        blockNumber: item.block_height,
                        timestamp: +(new Date(item.block_signed_at)),
                        profit: getBnToNumber(parseUnits(filtered.delta, 0)),
                        transactionHash: item.tx_hash,
                    }
                });
        });

        // for (let [fedIndex, fed] of feds.entries()) {
        //     await addBlockTimestamps(transfers[fedIndex].map(t => t.blockNumber), fed.chainId);
        // }

        // const blockTimestamps = await getCachedBlockTimestamps();

        const accProfits: { [key: string]: number } = {};
        let total = 0;

        const fedRevenues = filteredTransfers.map((fedTransfers, fedIndex) => {
            const fedAd = feds[fedIndex].address;
            if (!accProfits[fedAd]) { accProfits[fedAd] = 0 }
            return fedTransfers.map(t => {
                // const profit = getBnToNumber(t.args[2]);
                accProfits[fedAd] += t.profit;
                return {
                    ...t,
                    // transactionHash: t.transactionHash,
                    fedIndex: fedIndex,
                    // timestamp: blockTimestamps[feds[fedIndex].chainId][t.blockNumber] * 1000,
                    // profit,
                    accProfit: accProfits[fedAd],
                };
            })
        })
            .reduce((prev, curr) => prev.concat(curr), [])
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(event => {
                total += event.profit
                return { ...event, totalAccProfit: total }
            });

        const resultData = {
            totalEvents: fedRevenues,
        }

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            res.status(500).send('')
            console.error(e);
        }
    }
}