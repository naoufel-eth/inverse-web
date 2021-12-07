import { ExternalProvider, JsonRpcFetchFunc, Web3Provider } from '@ethersproject/providers'
import { BLOCK_SCAN } from '@inverse/config/constants'
import { getNetwork } from '@inverse/config/networks'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { hexValue, formatUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers';
import localforage from 'localforage';
import { BigNumberList } from '@inverse/types'

export const getLibrary = (provider: ExternalProvider | JsonRpcFetchFunc): Web3Provider => {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    1, // Mainnet
    3, // Ropsten
    4, // Rinkeby
    5, // Goerli
    42, // Kovan
  ],
})

export const walletConnectConnector = new WalletConnectConnector({
  rpc: {
    1: "https://cloudflare-eth.com"
  }
})

export async function fetchWithTimeout(input: RequestInfo, options: RequestInit = {}, timeout = 6000): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    const controller = new AbortController();

    const id = setTimeout(async () => {
      controller.abort();
      if (typeof input === 'string') {
        const cachedResults: any = await localforage.getItem(input).catch(() => undefined);
        if (cachedResults) {
          console.log('Timed out, returning last cached data for', input);
          resolve(new Response(JSON.stringify(cachedResults), { status: 200, headers: { "Content-Type": "application/json" } }))
        }
      }
      reject('Timeout and no cache found');
    }, timeout);

    const response = await fetch(input, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(id);

    resolve(response);
  });
}

export const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetchWithTimeout(input, init);

  if (!res?.ok) {
    // if api call fails, return cached results in browser
    if (typeof input === 'string') {
      const cachedResults = await localforage.getItem(input).catch(() => undefined);
      if (cachedResults) {
        return cachedResults;
      }
    }

    const error = new Error('An error occurred while fetching the data.')

    // @ts-ignore
    error.info = await res.json()

    // @ts-ignore
    error.status = res.status

    throw error
  }

  const data = res.json();

  if (typeof input === 'string') {
    await localforage.setItem(input, data).catch();
  }

  return data;
}

export const isPreviouslyConnected = (): boolean => {
  if (typeof window === undefined) { return false }
  return JSON.parse(window.localStorage.getItem('previouslyConnected') || 'false');
}

export const setIsPreviouslyConnected = (value: boolean): void => {
  if (typeof window === undefined) { return }
  return window.localStorage.setItem('previouslyConnected', JSON.stringify(value));
}

export const setPreviousChainId = (chainId: number | string): void => {
  if (typeof window === undefined) { return }
  try {
    window.localStorage.setItem('signerChainId', chainId.toString())
  } catch (e) {
    window.localStorage.clear();
    window.localStorage.setItem('signerChainId', chainId.toString());
  }
}

export const switchWalletNetwork = async (id: string | number, onSuccess?: () => void) => {
  const hexaChainId = hexValue(Number(id));
  try {
    await window?.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexaChainId }],
    });
    if (onSuccess) { onSuccess() }
  } catch (switchError: any) {
    console.log(switchError);
  }
}

// window.ethereum is injected by providers even if the user is not connected to our app
export const ethereumReady = async (timeout = 10000): Promise<boolean> => {
  const polling = 50;

  return new Promise((resolve) => {
    const checkReady = (nbAttempts: number) => {
      setTimeout(() => {
        if (window?.ethereum?.chainId) {
          resolve(true)
        } else if (nbAttempts * polling <= timeout) {
          checkReady(nbAttempts + 1);
        } else {
          resolve(false);
        }
      }, polling);
    }

    if (window?.ethereum?.chainId) {
      resolve(true);
    } else {
      checkReady(0);
    }
  });
}

export const getScanner = (id: string | number): string => id ? (getNetwork(id)?.scan || BLOCK_SCAN) : BLOCK_SCAN;

export const formatBalance = (balance: BigNumber, decimals: number, symbol = '') => {
  const floatBalance = balance ? parseFloat(formatUnits(balance, decimals)) : 0;
  const precision = balance?.gt(0) ? 10 : 2;

  return `${floatBalance.toFixed(precision)} ${symbol}`.trim();
}

export const hasAllowance = (approvals: BigNumberList, address: string): boolean => {
  return !!(approvals && approvals[address] && parseFloat(formatUnits(approvals[address])))
}
