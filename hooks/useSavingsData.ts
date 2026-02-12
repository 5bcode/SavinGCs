import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSavingsData() {
    const { data: potsData, error: potsError, isLoading: potsLoading } = useSWR('/api/pots', fetcher);
    const { data: accountsData, error: accountsError, isLoading: accountsLoading } = useSWR('/api/accounts', fetcher);

    return {
        pots: potsData?.pots || [],
        accounts: accountsData?.accounts || [],
        isLoading: potsLoading || accountsLoading,
        isError: potsError || accountsError,
        refresh: () => {
            mutate('/api/pots');
            mutate('/api/accounts');
        }
    };
}
