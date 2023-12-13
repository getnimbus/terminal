import React, { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import classNames from 'classnames';

import SwapSettingButton from './SwapSettingButton';
import InformationMessage from '../InformationMessage';
import CloseIcon from 'src/icons/CloseIcon';
import InfoIconSVG from 'src/icons/InfoIconSVG';
import Tooltip from '../Tooltip';

import Decimal from 'decimal.js';
import JupButton from '../JupButton';
import { detectedSeparator, formatNumber } from 'src/misc/utils';
import { DEFAULT_SLIPPAGE, useSlippageConfig } from 'src/contexts/SlippageConfigProvider';
import {
  PRIORITY_HIGH,
  PRIORITY_MAXIMUM_SUGGESTED,
  PRIORITY_NONE,
  PRIORITY_TURBO,
  useSwapContext,
} from 'src/contexts/SwapContext';
import Toggle from '../Toggle';
import { PreferredTokenListMode, useTokenContext } from 'src/contexts/TokenContextProvider';
import ExternalIcon from 'src/icons/ExternalIcon';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';

const Separator = ({ darkMode = false }: { darkMode?: boolean }) => (
  <div className={`my-4 border-b ${darkMode ? 'border-white/10' : 'border-black/10'}`} />
);

export type Forms = {
  slippagePreset?: string;
  slippageInput?: string;
  priorityPreset?: number;
  priorityInSOLInput?: number;
  priorityInSOLPreset?: number;

  onlyDirectRoutes: boolean;
  useWSol: boolean;
  asLegacyTransaction: boolean;
  preferredTokenListMode: PreferredTokenListMode;
};

const MINIMUM_SLIPPAGE = 0;
const MAXIMUM_SLIPPAGE = 50; // 50%
const MINIMUM_SUGGESTED_SLIPPAGE = 0.05; // 0.05%
const MAXIMUM_SUGGESTED_SLIPPAGE = 10; // 10%

export const PRIORITY_TEXT = {
  [PRIORITY_NONE]: `Normal`,
  [PRIORITY_HIGH]: `High`,
  [PRIORITY_TURBO]: `Turbo`,
};

const PRIORITY_PRESET: number[] = [PRIORITY_NONE, PRIORITY_HIGH, PRIORITY_TURBO];

const SetSlippage: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const {
    formProps: { darkMode },
    jupiter: { asLegacyTransaction, setAsLegacyTransaction, priorityFeeInSOL, setPriorityFeeInSOL },
  } = useSwapContext();
  const { slippage, setSlippage } = useSlippageConfig();
  const { preferredTokenListMode, setPreferredTokenListMode } = useTokenContext();
  const { wallet } = useWalletPassThrough();

  const SLIPPAGE_PRESET = useMemo(() => [String(DEFAULT_SLIPPAGE), '0.5', '1.0'], [DEFAULT_SLIPPAGE]);

  const slippageInitialPreset = useMemo(() => {
    return SLIPPAGE_PRESET.find((preset) => Number(preset) === slippage);
  }, [slippage, SLIPPAGE_PRESET]);

  const priorityInitialPreset = useMemo(() => {
    return PRIORITY_PRESET.find((preset) => Number(preset) === priorityFeeInSOL);
  }, [priorityFeeInSOL]);

  const form = useForm<Forms>({
    defaultValues: {
      ...(slippage
        ? slippageInitialPreset
          ? {
              slippagePreset: String(slippageInitialPreset),
            }
          : {
              slippageInput: String(slippage),
            }
        : {}),
      ...(typeof priorityFeeInSOL !== 'undefined' && typeof priorityInitialPreset !== 'undefined'
        ? {
            priorityInSOLPreset: priorityInitialPreset,
          }
        : {
            priorityInSOLInput: priorityFeeInSOL,
          }),
      asLegacyTransaction,
      preferredTokenListMode,
    },
  });

  /* SLIPPAGE */
  const [inputFocused, setInputFocused] = useState(!slippageInitialPreset);

  const slippageInput = form.watch('slippageInput');
  const slippagePreset = form.watch('slippagePreset');
  const isWithinSlippageLimits = useMemo(() => {
    return Number(slippageInput) >= MINIMUM_SLIPPAGE && Number(slippageInput) <= MAXIMUM_SLIPPAGE;
  }, [slippageInput]);

  const slippageSuggestionText = useMemo(() => {
    if (Number(slippageInput) <= MINIMUM_SUGGESTED_SLIPPAGE) {
      return <span>Your transaction may fail</span>;
    }

    if (Number(slippageInput) >= MAXIMUM_SUGGESTED_SLIPPAGE) {
      return <span>Warning, slippage is high</span>;
    }

    return '';
  }, [slippageInput]);

  const inputRef = useRef<HTMLInputElement>();
  /* END OF SLIPPAGE */

  /* PRIORITY FEE */
  const [inputPriorityFocused, setInputPriorityFocused] = useState(typeof priorityInitialPreset === 'undefined');

  const priorityInSOLPreset = form.watch('priorityInSOLPreset');
  const inputPriorityRef = useRef<HTMLInputElement>();
  const priorityInSOLInput = form.watch('priorityInSOLInput');
  const isWithinPriorityLimits = useMemo(() => {
    return Number(priorityInSOLInput) <= PRIORITY_MAXIMUM_SUGGESTED;
  }, [priorityInSOLInput]);

  const prioritySuggestionText = useMemo(() => {
    if (Number(priorityInSOLInput) > PRIORITY_MAXIMUM_SUGGESTED) {
      return (
        <span>
          Warning, max priority fee is over the suggested amount of {formatNumber.format(PRIORITY_MAXIMUM_SUGGESTED)}{' '}
          SOL.
        </span>
      );
    }
    return '';
  }, [priorityInSOLInput]);
  /* END OF PRIORITY FEE */

  const isDisabled = (() => {
    const isSlippageDisabled = (() => {
      if (inputFocused && !slippageInput) return true;
      if (slippagePreset) return false;
      else return !isWithinSlippageLimits;
    })();

    const isPriorityInputDisabled = (() => {
      if (inputPriorityFocused && !priorityInSOLInput) return true;
      if (typeof priorityInSOLPreset !== 'undefined') return false;
      else return !isWithinPriorityLimits;
    })();

    return isSlippageDisabled || isPriorityInputDisabled;
  })();

  const asLegacyTransactionInput = form.watch('asLegacyTransaction');
  const preferredTokenListModeInput = form.watch('preferredTokenListMode');
  const onClickSave = () => {
    if (isDisabled) return;

    const slippage = Number(slippageInput ?? slippagePreset);
    if (typeof slippage === 'number') {
      setSlippage(slippage);
    }

    const priority = Number(priorityInSOLInput ?? priorityInSOLPreset);
    if (typeof priority === 'number') {
      setPriorityFeeInSOL(priority);
    }

    setAsLegacyTransaction(asLegacyTransactionInput);
    setPreferredTokenListMode(preferredTokenListModeInput);
    closeModal();
  };

  const detectedVerTxSupport = useMemo(() => {
    return wallet?.adapter?.supportedTransactionVersions?.has(0);
  }, [wallet]);

  return (
    <div
      className={`w-full rounded-xl flex flex-col shadow-xl max-h-[90%] ${
        darkMode ? 'bg-jupiter-bg text-white' : 'bg-white text-black shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="text-sm font-semibold">
          <span>Swap Settings</span>
        </div>
        <div
          className={`cursor-pointer fill-current ${darkMode ? 'text-white' : 'text-black'}`}
          onClick={() => closeModal()}
        >
          <CloseIcon width={14} height={14} />
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit((value) => {
          const slippage = Number(value.slippageInput ?? value.slippagePreset);
          if (typeof slippage === 'number') {
            setSlippage(slippage);
            closeModal();
          }
        })}
        className={classNames('relative w-full overflow-y-auto webkit-scrollbar overflow-x-hidden')}
      >
        <div>
          <div className={classNames('mt-2 px-5')}>
            {/**************************** PRIORTY *****************************/}
            <div className={`flex items-center text-sm font-[500] ${darkMode ? 'text-white/75' : 'text-black/75'}`}>
              <span>Transaction Priority</span>
              <Tooltip
                variant={darkMode ? 'dark' : 'light'}
                className="!left-0 !top-16 w-[50%]"
                content={
                  <span className={`flex text-xs rounded-lg ${darkMode ? 'text-white/75' : 'text-black/75'}`}>
                    The priority fee is paid to the Solana network. This additional fee helps boost how a transaction is
                    prioritized against others, resulting in faster transaction execution times.
                  </span>
                }
              >
                <div className="flex ml-2.5 items-center text-white-35 fill-current">
                  <InfoIconSVG width={12} height={12} />
                </div>
              </Tooltip>
            </div>

            <div
              className={`flex items-center mt-2.5 rounded-xl ring-1 overflow-hidden ${
                darkMode ? 'ring-white/5' : 'ring-black/5'
              }`}
            >
              <Controller
                name="priorityInSOLInput"
                control={form.control}
                render={({}) => {
                  return (
                    <>
                      {PRIORITY_PRESET.map((item, idx) => {
                        const name = PRIORITY_TEXT[item as keyof typeof PRIORITY_TEXT];
                        return (
                          <SwapSettingButton
                            key={idx}
                            idx={idx}
                            itemsCount={PRIORITY_PRESET.length}
                            roundBorder={idx === 0 ? 'left' : idx === SLIPPAGE_PRESET.length - 1 ? 'right' : undefined}
                            highlighted={!inputPriorityFocused && priorityInSOLPreset === item}
                            onClick={() => {
                              form.setValue('priorityInSOLPreset', item);
                              form.setValue('priorityInSOLInput', undefined);
                              setInputPriorityFocused(false);
                            }}
                          >
                            <div className="whitespace-nowrap">
                              <p className={`text-sm ${darkMode ? 'text-white' : 'text-black'}`}>{name}</p>
                              <span className="mt-1 text-xs">{item} SOL</span>
                            </div>
                          </SwapSettingButton>
                        );
                      })}
                    </>
                  );
                }}
              />
            </div>

            <div className="mt-1">
              <span className={`text-xs font-500 ${darkMode ? 'text-white/75' : 'text-black/75'}`}>
                or set manually:
              </span>

              <div
                className={`relative mt-1 ${
                  inputPriorityFocused ? 'v2-border-gradient v2-border-gradient-center' : ''
                }`}
              >
                <Controller
                  name={'priorityInSOLInput'}
                  control={form.control}
                  render={({ field: { onChange, value } }) => {
                    const thousandSeparator = detectedSeparator === ',' ? '.' : ',';

                    return (
                      <NumericFormat
                        value={typeof value === 'undefined' ? '' : value}
                        decimalScale={9}
                        thousandSeparator={thousandSeparator}
                        getInputRef={(el: HTMLInputElement) => (inputPriorityRef.current = el)}
                        allowNegative={false}
                        onValueChange={({ floatValue }) => {
                          onChange(floatValue);

                          // Prevent both slippageInput and slippagePreset to reset each oter
                          if (typeof floatValue !== 'undefined') {
                            form.setValue('priorityInSOLPreset', undefined);
                          }
                        }}
                        onFocus={() => {
                          inputPriorityRef.current?.focus();
                          setInputPriorityFocused(true);
                        }}
                        maxLength={12}
                        placeholder={'0.0000'}
                        className={`text-left h-full w-full py-4 px-5 text-sm rounded-xl ring-1 pointer-events-all relative ${
                          darkMode
                            ? 'bg-[#1B1B1E] placeholder:text-white/25 ring-white/5 text-white/50'
                            : 'bg-gray-200 placeholder:text-black/25 ring-black/5 text-black/50'
                        }`}
                        decimalSeparator={detectedSeparator}
                      />
                    );
                  }}
                />
                <span className={`absolute text-sm right-4 top-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
                  SOL
                </span>
              </div>

              <div className="">
                {typeof priorityInSOLPreset === 'undefined' && priorityInSOLInput !== 0 ? (
                  <span className={`text-xs ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
                    <span>This will cost an additional {new Decimal(priorityInSOLInput || 0).toString()} SOL.</span>
                  </span>
                ) : null}

                {inputPriorityFocused && !isWithinPriorityLimits && (
                  <InformationMessage
                    darkMode={darkMode}
                    iconSize={14}
                    className="!text-jupiter-primary !px-0"
                    message={`Please set a priority fee within ${formatNumber.format(PRIORITY_MAXIMUM_SUGGESTED)} SOL`}
                  />
                )}

                {typeof priorityInSOLPreset === 'undefined' && prioritySuggestionText && (
                  <InformationMessage
                    darkMode={darkMode}
                    iconSize={14}
                    className="!text-jupiter-primary !px-0 mb-2"
                    message={prioritySuggestionText}
                  />
                )}
              </div>
            </div>

            <Separator darkMode={darkMode} />
            {/**************************** SLIPPAGE *****************************/}
            <div className={`flex items-center text-sm font-[500] ${darkMode ? 'text-white/75' : 'text-black/75'}`}>
              <span>Slippage Settings</span>
            </div>

            <div className="flex items-center mt-2.5 rounded-xl ring-1 ring-white/5 overflow-hidden text-sm h-[52px]">
              <Controller
                name="slippagePreset"
                control={form.control}
                render={({ field: { onChange, value } }) => {
                  return (
                    <>
                      {SLIPPAGE_PRESET.map((item, idx) => {
                        const displayText = formatNumber.format(Number(item)) + '%';

                        return (
                          <SwapSettingButton
                            key={idx}
                            idx={idx}
                            itemsCount={SLIPPAGE_PRESET.length}
                            className="h-full"
                            roundBorder={idx === 0 ? 'left' : undefined}
                            highlighted={!inputFocused && Number(value) === Number(item)}
                            onClick={() => {
                              onChange(item);
                              setInputFocused(false);
                              form.setValue('slippageInput', undefined);
                            }}
                          >
                            {displayText}
                          </SwapSettingButton>
                        );
                      })}
                    </>
                  );
                }}
              />

              <div
                onClick={() => {
                  inputRef.current?.focus();
                  setInputFocused(true);
                }}
                className={`flex items-center justify-between cursor-text w-[120px] h-full pl-2 text-sm relative border-l border-black-10 border-white/5 ${
                  darkMode ? 'text-white/50 bg-[#1B1B1E]' : 'text-black/50 bg-gray-400'
                } ${inputFocused ? 'v2-border-gradient v2-border-gradient-right' : ''}`}
              >
                <span className="text-xs">
                  <span>Custom</span>
                </span>

                <Controller
                  name={'slippageInput'}
                  control={form.control}
                  render={({ field: { onChange, value } }) => (
                    <NumericFormat
                      value={typeof value === 'undefined' ? '' : value}
                      decimalScale={2}
                      isAllowed={(value) => {
                        // This is for onChange events, we dont care about Minimum slippage here, to allow more natural inputs
                        return (value.floatValue || 0) <= 100 && (value.floatValue || 0) >= 0;
                      }}
                      getInputRef={(el: HTMLInputElement) => (inputRef.current = el)}
                      allowNegative={false}
                      onValueChange={({ floatValue }) => {
                        onChange(floatValue);

                        // Prevent both slippageInput and slippagePreset to reset each oter
                        if (typeof floatValue !== 'undefined') {
                          form.setValue('slippagePreset', undefined);
                        }
                      }}
                      allowLeadingZeros={false}
                      suffix="%"
                      className={`w-full h-full py-4 pr-4 text-sm text-right bg-transparent rounded-lg pointer-events-all ${
                        darkMode ? 'placeholder:text-white/25 text-white/50' : 'placeholder:text-black/50 text-black/50'
                      }`}
                      decimalSeparator={detectedSeparator}
                      placeholder={detectedSeparator === ',' ? '0,00%' : '0.00%'}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              {inputFocused && !isWithinSlippageLimits && (
                <InformationMessage
                  darkMode={darkMode}
                  iconSize={14}
                  className="!text-jupiter-primary !px-0"
                  message={`Please set a slippage value that is within ${MINIMUM_SLIPPAGE}% to ${MAXIMUM_SLIPPAGE}%`}
                />
              )}

              {slippageSuggestionText && (
                <InformationMessage
                  darkMode={darkMode}
                  iconSize={14}
                  className="!text-jupiter-primary !px-0"
                  message={slippageSuggestionText}
                />
              )}
            </div>

            <Separator darkMode={darkMode} />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold">Versioned Tx.</p>

                <a
                  href="https://docs.jup.ag/docs/additional-topics/composing-with-versioned-transaction#what-are-versioned-transactions"
                  rel="noreferrer"
                  target={'_blank'}
                  className="cursor-pointer"
                >
                  <ExternalIcon />
                </a>
              </div>

              <Toggle
                active={!asLegacyTransactionInput}
                onClick={() => form.setValue('asLegacyTransaction', !asLegacyTransactionInput)}
              />
            </div>
            <p className={`mt-2 text-xs ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
              Versioned Tx is a significant upgrade that allows for more advanced routings and better prices!
            </p>

            {wallet?.adapter ? (
              <p className={`mt-2 text-xs ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
                {detectedVerTxSupport
                  ? `Your wallet supports Versioned Tx. and it has been turned on by default.`
                  : `Your wallet does not support Versioned Tx.`}
              </p>
            ) : null}

            <Separator darkMode={darkMode} />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold">Strict Token list</p>

                <a
                  href="https://docs.jup.ag/docs/token-list/token-list-api"
                  rel="noreferrer"
                  target={'_blank'}
                  className="cursor-pointer"
                >
                  <ExternalIcon />
                </a>
              </div>
              <Toggle
                active={preferredTokenListModeInput === 'strict'}
                onClick={() =>
                  form.setValue('preferredTokenListMode', preferredTokenListModeInput === 'strict' ? 'all' : 'strict')
                }
              />
            </div>
            <p className={`mt-2 text-xs ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
              {`The strict list contains a smaller set of validated tokens. To see all tokens, toggle "off".`}
            </p>
          </div>

          <div className="px-5 pb-5">
            <JupButton
              darkMode={darkMode}
              type="button"
              onClick={onClickSave}
              className={'w-full mt-4'}
              disabled={isDisabled}
              size={'lg'}
            >
              <span>Save Settings</span>
            </JupButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SetSlippage;
