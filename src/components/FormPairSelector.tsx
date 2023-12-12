import { TokenInfo } from '@solana/spl-token-registry';
import classNames from 'classnames';
import React, { createRef, memo, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { areEqual, FixedSizeList, ListChildComponentProps } from 'react-window';
import LeftArrowIcon from 'src/icons/LeftArrowIcon';
import SearchIcon from 'src/icons/SearchIcon';
import { PAIR_SELECTOR_TOP_TOKENS } from 'src/misc/constants';

import { useAccounts } from '../contexts/accounts';

import FormPairRow from './FormPairRow';
import { useUSDValueProvider } from 'src/contexts/USDValueProvider';
import Decimal from 'decimal.js';

export const PAIR_ROW_HEIGHT = 72;
const SEARCH_BOX_HEIGHT = 56;

// eslint-disable-next-line react/display-name
const rowRenderer = memo((props: ListChildComponentProps) => {
  const { data, index, style } = props;
  const item = data.searchResult[index];

  return <FormPairRow key={item.address} item={item} style={style} onSubmit={data.onSubmit} />;
}, areEqual);

const FormPairSelector = ({
  onSubmit,
  tokenInfos,
  onClose,
  darkMode = false,
}: {
  onSubmit: (value: TokenInfo) => void;
  onClose: () => void;
  tokenInfos: TokenInfo[];
  darkMode?: boolean;
}) => {
  const { accounts } = useAccounts();
  const { tokenPriceMap } = useUSDValueProvider();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<TokenInfo[]>(tokenInfos);
  useEffect(() => {
    const sortedList = tokenInfos
      .sort((a, b) => {
        return PAIR_SELECTOR_TOP_TOKENS.includes(a.address) && !PAIR_SELECTOR_TOP_TOKENS.includes(b.address) ? -1 : 1;
      })
      .sort((a, b) => {
        if (!accounts[a.address]) return 1;
        if (!accounts[b.address]) return -1;

        const [tokenAPrice, tokenBPrice] = [tokenPriceMap[a.address]?.usd, tokenPriceMap[b.address]?.usd];

        // Sort by USD value
        if (tokenAPrice && tokenBPrice) {
          const totalAValue = new Decimal(tokenAPrice).mul(accounts[a.address].balance);
          const totalBValue = new Decimal(tokenBPrice).mul(accounts[b.address].balance);
          return totalBValue.gt(totalAValue) ? 1 : -1;
        }

        // If no usd value, sort by balance
        return accounts[b.address].balance - accounts[a.address].balance;
      });

    if (searchTerm) {
      const filteredList = sortedList.filter((item) => item.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
      setSearchResult(filteredList);
    } else {
      setSearchResult(sortedList);
    }
  }, [accounts, tokenInfos, searchTerm]);

  const listRef = createRef<FixedSizeList>();
  const inputRef = createRef<HTMLInputElement>();
  useEffect(() => inputRef.current?.focus(), [inputRef]);

  return (
    <div className="flex flex-col w-full h-full px-2 py-4">
      <div className="flex justify-between w-full">
        <div className="w-6 h-6 text-white cursor-pointer fill-current" onClick={onClose}>
          <LeftArrowIcon width={24} height={24} />
        </div>

        <div className="text-white">Select Token</div>

        <div className="w-6 h-6 " />
      </div>

      <div
        className={`flex px-5 mt-4 w-[98%] rounded-xl ${darkMode ? 'bg-[#212128]' : 'bg-gray-500'}`}
        style={{ height: SEARCH_BOX_HEIGHT, maxHeight: SEARCH_BOX_HEIGHT }}
      >
        <SearchIcon />

        <input
          autoComplete="off"
          className={`w-full rounded-xl ml-4 truncate text-white/50 placeholder:text-white/20 ${
            darkMode ? 'bg-[#212128]' : 'bg-gray-500'
          }`}
          placeholder={`Search`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          ref={inputRef}
        />
      </div>

      <div className="mt-2" style={{ flexGrow: 1 }}>
        {searchResult.length > 0 && (
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => {
              return (
                <FixedSizeList
                  ref={listRef}
                  height={height}
                  itemCount={searchResult.length}
                  itemSize={PAIR_ROW_HEIGHT}
                  width={width - 2} // -2 for scrollbar
                  itemData={{
                    searchResult,
                    onSubmit,
                  }}
                  className={classNames('overflow-y-scroll mr-1 min-h-[12rem] px-5 webkit-scrollbar')}
                >
                  {rowRenderer}
                </FixedSizeList>
              );
            }}
          </AutoSizer>
        )}

        {searchResult.length === 0 ? (
          <div className="mt-4 mb-4 text-center text-white/50">
            <span>No tokens found</span>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default FormPairSelector;
