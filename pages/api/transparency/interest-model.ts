import { Contract } from 'ethers'
import 'source-map-support'
import { INTEREST_MODEL_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { BLOCKS_PER_YEAR, ETH_MANTISSA, INTEREST_MODEL } from '@app/config/constants';

export default async function handler(req, res) {

  const cacheKey = `interest-model-v1.0.1`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 900);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const interestModelContract = new Contract(INTEREST_MODEL, INTEREST_MODEL_ABI, provider);

    const results = await Promise.all([
      interestModelContract.blocksPerYear(),
      interestModelContract.kink(),
      interestModelContract.multiplierPerBlock(),
      interestModelContract.jumpMultiplierPerBlock(),
      interestModelContract.baseRatePerBlock(),
    ])

    // const blocksPerYear = parseFloat(results[0].toString());

    const resultData = {
      kink: results[1] / ETH_MANTISSA * 100,
      multiplierPerYear: results[2] / ETH_MANTISSA * BLOCKS_PER_YEAR * 100,
      jumpMultiplierPerYear: results[3] / ETH_MANTISSA * BLOCKS_PER_YEAR * 100,
      baseRatePerYear: results[4] / ETH_MANTISSA * BLOCKS_PER_YEAR * 100,
      blocksPerYear: BLOCKS_PER_YEAR,
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
      console.error(e);
    }
  }
}