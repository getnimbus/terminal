import React, { FC, useMemo, useRef, useState } from 'react';
import { useScreenState } from 'src/contexts/ScreenProvider';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';
import { useOutsideClick } from 'src/misc/utils';
import { CurrentUserBadge } from '../CurrentUserBadge';

import { WalletModalButton } from './components/WalletModalButton';
import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';

export const WalletButton: FC<{ darkMode: boolean; setIsWalletModalOpen(toggle: boolean): void }> = ({
  darkMode = false,
  setIsWalletModalOpen,
}) => {
  const { publicKey, connected, connecting, disconnect } = useWalletPassThrough();
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLUListElement>(null);
  const { screen } = useScreenState();

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const onClickDisconnect = () => {
    setActive(false);
    disconnect();
  };

  const closePopup = () => {
    setActive(false);
  };
  useOutsideClick(ref, closePopup);

  if ((!connected && !connecting) || !base58) {
    return (
      <UnifiedWalletButton
        buttonClassName="!bg-transparent"
        overrideContent={<WalletModalButton darkMode={darkMode} setIsWalletModalOpen={setIsWalletModalOpen} />}
      />
    );
  }

  return (
    <div className="relative cursor-pointer">
      <div
        className={`rounded-2xl ${darkMode ? 'text-white bg-[#191B1F]' : 'text-white bg-[#1e96fc]'}`}
        onClick={() => setActive(!active)}
      >
        <CurrentUserBadge />
      </div>

      {screen === 'Initial' ? (
        <ul
          aria-label="dropdown-list"
          className={`
            ${darkMode ? 'bg-black text-white' : 'bg-gray-200 text-black'}
            ${active ? 'absolute block top-10 right-0 text-sm rounded-lg p-2' : 'hidden'}`}
          ref={ref}
          role="menu"
        >
          <li onClick={onClickDisconnect} role="menuitem">
            <span>Disconnect</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
};
