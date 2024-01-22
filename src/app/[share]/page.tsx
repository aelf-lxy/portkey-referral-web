'use client';
import clsx from 'clsx';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { DIDWalletInfo, SignIn, ISignIn, PortkeyProvider, singleMessage, did } from '@portkey/did-ui-react';
import { useCopyToClipboard } from 'react-use';
import BaseImage from '@/components/BaseImage';
import portkeyLogoWhite from '/public/portkeyLogoWhite.svg';
import logoWhite from '/public/logoWhite.svg';
import styles from './page.module.scss';
import QRCode from '@/components/QRCode';
import { referralWaterMark, referralColorBox, referralBgLines, referralDiscover } from '@/assets/images';
import { useUserAgent } from '@/hooks/useUserAgent';
import { isMobile, isAndroid, isIOS } from '@/utils/device';
import { downloadData, portkeyDownloadPage, privacyPolicy, termsOfService } from '@/constants/pageData';
import IOSDownloadBtn from '@/components/DownloadButtons/IOSDownloadBtn';
import AndroidDownloadBtn from '@/components/DownloadButtons/AndroidDownloadBtn';
import '@portkey/did-ui-react/dist/assets/index.css';
import { openWithBlank } from '@/utils/router';
import { useSearchParams } from 'next/navigation';
import { API, get } from '@/utils/axios';

enum REFERRAL_USER_STATE {
  REFERRAL = 'referral',
  INVITEE = 'invitee',
}

type TReferralProps = { share: REFERRAL_USER_STATE };

const Referral: React.FC<{ params: TReferralProps }> = ({ params }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [androidStoreUrl, setAndroidStoreUrl] = useState('');
  const [iOSStoreUrl, setIOSStoreUrl] = useState('');
  const [copyState, copyToClipboard] = useCopyToClipboard();
  const signInRef = useRef<ISignIn>(null);
  const uaType = useUserAgent();
  const searchParams = useSearchParams();

  const referralCode = searchParams.get('referral_code');
  const projectCode = searchParams.get('project_code');
  const shortLink = searchParams.get('shortLink') || '';
  const userRole = params.share;
  console.log('referralCode', referralCode);
  console.log('projectCode', projectCode);
  console.log('userRole', userRole);

  did.setConfig({
    graphQLUrl: '/graphql',
    referralInfo: {
      referralCode: referralCode || undefined,
      projectCode: projectCode || undefined,
    },
  });

  const onSignUp = () => {
    console.log('singup');
    signInRef.current?.setOpen(true);
  };

  const onCancel = useCallback(() => signInRef.current?.setOpen(false), [signInRef]);

  const onFinish = useCallback(async (didWallet: DIDWalletInfo) => {
    console.log('didWallet', didWallet);
    setIsSignUp(true);

    const downloadResource = await get(API.GET.DOWNLOAD);
    setAndroidStoreUrl(downloadResource?.androidDownloadUrl || '');
    setIOSStoreUrl(downloadResource?.iosDownloadUrl || '');
  }, []);

  const getSloganCls = useMemo(() => {
    return userRole === REFERRAL_USER_STATE.REFERRAL ? styles.sloganReference : styles.sloganInvitee;
  }, [userRole]);

  const onDownload = () => {
    openWithBlank(portkeyDownloadPage);
  };

  const onCopyClick = () => {
    copyToClipboard(shortLink);
    copyState.error
      ? singleMessage.error(copyState.error.message)
      : copyState.value && singleMessage.success('copy success!');
  };

  return (
    <div className={styles.referralPage}>
      <div className={styles.referralBlueContainer}>
        <header className="row-center">
          <div className={clsx(['flex-row-center', styles.referralHeader])}>
            <BaseImage className={styles.portkeyLogo} src={portkeyLogoWhite} priority alt="portkeyLogo" />
          </div>
        </header>
        <div className={styles.referalMainContainer}>
          <BaseImage
            src={referralWaterMark}
            className={styles.bgWaterMark}
            alt="waterMark"
            priority
            width={253}
            height={378}
          />
          <BaseImage src={referralBgLines} className={styles.bgLines} alt="bglines" priority />
          <div className={styles.sloganWrapper}>
            <div className={getSloganCls}></div>
          </div>
          {userRole === REFERRAL_USER_STATE.INVITEE && (
            <div className={styles.inviteeText}>Seize the opportunity. Expect upcoming suprises!</div>
          )}
          <BaseImage src={referralColorBox} className={styles.bgColorBox} alt="bgColorBox" priority />
        </div>
      </div>

      <div className={styles.referralBlackWrapper}>
        {userRole === REFERRAL_USER_STATE.REFERRAL && shortLink && (
          <div className={styles.QRcodeWrapper}>
            <QRCode value={shortLink} size={132} quietZone={6} ecLevel="H" />
            <div className={styles.QRcodeContent}>
              <div className={styles.QRcodeTitle}>Referral Link</div>
              <div className={styles.QRcodeUrlWrapper}>
                <div className={styles.QRcodeUrl}>{shortLink}</div>
                <BaseImage
                  src={referralDiscover}
                  className={styles.QRcodeCopy}
                  alt="QRcodeCopy"
                  priority
                  width={20}
                  onClick={onCopyClick}
                />
              </div>
            </div>
          </div>
        )}

        {userRole === REFERRAL_USER_STATE.INVITEE && (
          <>
            {!isSignUp && (
              <button className={styles.referralBtn} onClick={onSignUp}>
                Sign up
              </button>
            )}

            {isSignUp && !isMobile(uaType) && (
              <>
                <div className={styles.downTipsPC}>{downloadData.downloadText}</div>
                <button className={styles.referralBtn} onClick={onDownload}>
                  Download
                </button>
              </>
            )}

            {isSignUp && isMobile(uaType) && (
              <div className={clsx('ios-safe-bottom', styles.Mdownload)}>
                <BaseImage src={logoWhite} width={32} height={32} alt="logo" />
                <div className={styles.downTipM}>{downloadData.downloadText}</div>
                {isIOS(uaType) && <IOSDownloadBtn url={iOSStoreUrl} />}
                {isAndroid(uaType) && <AndroidDownloadBtn url={androidStoreUrl} />}
              </div>
            )}
          </>
        )}
      </div>

      <PortkeyProvider networkType="TESTNET">
        <SignIn
          className={styles['invitee-sign-in']}
          defaultLifeCycle={{
            SignUp: undefined,
          }}
          termsOfService={termsOfService}
          privacyPolicy={privacyPolicy}
          uiType="Modal"
          ref={signInRef}
          onFinish={onFinish}
          onCancel={onCancel}
        />
      </PortkeyProvider>
    </div>
  );
};

export default Referral;
