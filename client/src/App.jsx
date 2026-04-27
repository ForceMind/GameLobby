import { useEffect, useMemo, useState } from 'react';
import './App.css';
import SpriteIcon from './components/SpriteIcon';
import {
  announcements,
  arenaPopulation,
  benefitTimeline,
  coinPacks,
  devices,
  eventCards,
  games,
  globalRules,
  heroSlides,
  inviteTiers,
  leaderboard,
  missionSeed,
  packBenefits,
  profileRecords,
  quickActions,
  securityStatus,
  tabs,
  tournaments,
  walletBreakdown,
} from './data/uiData';
import { ArenaPage, EventsPage, LobbyPage, ProfilePage, StorePage } from './pages/MainPages';
import {
  ArenaRulesDetail,
  BenefitsDetail,
  GameDetail,
  NoticeDetail,
  TournamentDetail,
} from './pages/LobbyArenaDetails';
import {
  CheckinDetail,
  InviteDetail,
  MissionDetail,
  PackDetail,
  RecordsDetail,
  RedeemDetail,
  SecurityDetail,
  VipDetail,
  WalletDetail,
  WheelDetail,
} from './pages/EventStoreProfileDetails';

function formatNumber(value) {
  return value.toLocaleString('zh-CN');
}

function App() {
  const [page, setPage] = useState({ tab: 'lobby', detail: null, payload: null });
  const [activeCategory, setActiveCategory] = useState('全部');
  const [heroIndex, setHeroIndex] = useState(0);
  const [coins, setCoins] = useState(228680);
  const [activityCoins, setActivityCoins] = useState(420);
  const [toast, setToast] = useState('');
  const [pickedDays, setPickedDays] = useState([true, true, false, false, false, false, false]);
  const [missions, setMissions] = useState(missionSeed);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => ['全部', ...new Set(games.map((game) => game.category))], []);
  const filteredGames = useMemo(() => {
    if (activeCategory === '全部') {
      return games;
    }
    return games.filter((game) => game.category === activeCategory);
  }, [activeCategory]);

  const currentHero = heroSlides[heroIndex];
  const activeGame = games.find((game) => game.id === page.payload?.gameId) ?? games[0];
  const activeTournament = tournaments.find((item) => item.id === page.payload?.tournamentId) ?? tournaments[0];
  const activePack = coinPacks.find((item) => item.id === page.payload?.packId) ?? coinPacks[1];

  const openMainTab = (tab) => setPage({ tab, detail: null, payload: null });
  const openDetail = (detail, payload = null) => setPage((prev) => ({ ...prev, detail, payload }));
  const showToast = (message) => setToast(message);

  const addRewards = (coinGain, tokenGain, message) => {
    setCoins((prev) => prev + coinGain);
    setActivityCoins((prev) => prev + tokenGain);
    showToast(message);
  };

  const claimDay = (index) => {
    if (pickedDays[index]) {
      return;
    }

    const next = [...pickedDays];
    next[index] = true;
    setPickedDays(next);

    const coinGain = index === 6 ? 888 : 188;
    const tokenGain = index === 6 ? 6 : 1;
    addRewards(coinGain, tokenGain, `签到成功 +${coinGain} 金币 +${tokenGain} 活动币`);
  };

  const claimMission = (id) => {
    const mission = missions.find((item) => item.id === id);
    if (!mission || mission.progress < mission.total) {
      showToast('任务尚未完成');
      return;
    }

    setMissions((prev) => prev.filter((item) => item.id !== id));
    addRewards(
      mission.coinReward,
      mission.tokenReward,
      `任务奖励 +${mission.coinReward} 金币 +${mission.tokenReward} 活动币`
    );
  };

  const spinWheel = () => {
    if (isSpinning) {
      return;
    }

    setIsSpinning(true);
    const delta = 1800 + Math.floor(Math.random() * 360);
    setWheelAngle((prev) => prev + delta);

    window.setTimeout(() => {
      setIsSpinning(false);
      const reward = [
        { coin: 188, token: 0 },
        { coin: 388, token: 2 },
        { coin: 588, token: 4 },
        { coin: 888, token: 8 },
      ][Math.floor(Math.random() * 4)];

      addRewards(
        reward.coin,
        reward.token,
        `转盘奖励 +${reward.coin} 金币 +${reward.token} 活动币`
      );
    }, 3400);
  };

  const buyPack = (pack) => {
    const amount = Number(pack.coin.replaceAll(',', ''));
    const bonusRate = Number(pack.bonus.replace('+', '').replace('%', '')) / 100;
    const total = Math.round(amount * (1 + bonusRate));
    addRewards(total, pack.tokenBonus, `充值到账 ${formatNumber(total)} 金币 +${pack.tokenBonus} 活动币`);
  };

  const activateVip = () => addRewards(0, 120, '月卡开通成功，立即到账 120 活动币');

  const handleRedeem = () => {
    if (!redeemCode.trim()) {
      showToast('请输入兑换码');
      return;
    }

    setRedeemCode('');
    addRewards(666, 12, '兑换成功 +666 金币 +12 活动币');
  };

  const copyInviteCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText('COCO-2026');
      }
      showToast('邀请码已复制');
    } catch {
      showToast('当前环境不支持复制');
    }
  };

  const renderPage = () => {
    if (page.detail === 'benefits') {
      return (
        <BenefitsDetail
          eventCards={eventCards}
          benefitTimeline={benefitTimeline}
          coins={coins}
          activityCoins={activityCoins}
          openMainTab={openMainTab}
          openDetail={openDetail}
          formatNumber={formatNumber}
        />
      );
    }
    if (page.detail === 'notice') {
      return <NoticeDetail announcements={announcements} openMainTab={openMainTab} />;
    }
    if (page.detail === 'game') {
      return <GameDetail game={activeGame} openMainTab={openMainTab} openDetail={openDetail} showToast={showToast} />;
    }
    if (page.detail === 'arenaRules') {
      return <ArenaRulesDetail globalRules={globalRules} openMainTab={openMainTab} />;
    }
    if (page.detail === 'tournament') {
      return <TournamentDetail tournament={activeTournament} openMainTab={openMainTab} showToast={showToast} />;
    }
    if (page.detail === 'checkin') {
      return <CheckinDetail pickedDays={pickedDays} claimDay={claimDay} openMainTab={openMainTab} />;
    }
    if (page.detail === 'wheel') {
      return <WheelDetail wheelAngle={wheelAngle} isSpinning={isSpinning} spinWheel={spinWheel} openMainTab={openMainTab} />;
    }
    if (page.detail === 'missionCenter') {
      return <MissionDetail missions={missions} claimMission={claimMission} openMainTab={openMainTab} />;
    }
    if (page.detail === 'inviteClub') {
      return <InviteDetail inviteTiers={inviteTiers} copyInviteCode={copyInviteCode} openMainTab={openMainTab} />;
    }
    if (page.detail === 'pack') {
      return <PackDetail pack={activePack} packBenefits={packBenefits} buyPack={buyPack} openMainTab={openMainTab} openDetail={openDetail} />;
    }
    if (page.detail === 'vipCard') {
      return <VipDetail activateVip={activateVip} openMainTab={openMainTab} />;
    }
    if (page.detail === 'redeemCenter') {
      return <RedeemDetail redeemCode={redeemCode} setRedeemCode={setRedeemCode} handleRedeem={handleRedeem} openMainTab={openMainTab} />;
    }
    if (page.detail === 'wallet') {
      return <WalletDetail coins={coins} activityCoins={activityCoins} walletBreakdown={walletBreakdown} openMainTab={openMainTab} formatNumber={formatNumber} />;
    }
    if (page.detail === 'records') {
      return <RecordsDetail profileRecords={profileRecords} openMainTab={openMainTab} formatNumber={formatNumber} />;
    }
    if (page.detail === 'security') {
      return <SecurityDetail securityStatus={securityStatus} devices={devices} openMainTab={openMainTab} />;
    }

    if (page.tab === 'arena') {
      return <ArenaPage tournaments={tournaments} arenaPopulation={arenaPopulation} globalRules={globalRules} openDetail={openDetail} />;
    }
    if (page.tab === 'events') {
      return <EventsPage eventCards={eventCards} missions={missions} openDetail={openDetail} activityCoins={activityCoins} />;
    }
    if (page.tab === 'store') {
      return <StorePage coinPacks={coinPacks} openDetail={openDetail} />;
    }
    if (page.tab === 'profile') {
      return <ProfilePage coins={coins} activityCoins={activityCoins} profileRecords={profileRecords} securityStatus={securityStatus} openDetail={openDetail} formatNumber={formatNumber} />;
    }

    return (
      <LobbyPage
        currentHero={currentHero}
        heroIndex={heroIndex}
        heroSlides={heroSlides}
        quickActions={quickActions}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        filteredGames={filteredGames}
        announcements={announcements}
        leaderboard={leaderboard}
        openDetail={openDetail}
      />
    );
  };

  return (
    <div className="app-root">
      <div className="aurora aurora-a" aria-hidden="true" />
      <div className="aurora aurora-b" aria-hidden="true" />
      <div className="aurora aurora-c" aria-hidden="true" />

      <header className="top-shell">
        <button type="button" className="brand-chip" onClick={() => openMainTab('lobby')}>
          <SpriteIcon name="logo" size={42} />
          <div className="brand-copy">
            <strong>cocogames lobby</strong>
            <span>sprite driven UI prototype</span>
          </div>
        </button>

        <div className="header-actions">
          <button type="button" className="mini-icon-btn" onClick={() => openDetail('notice')}>
            <SpriteIcon name="bell" size={22} />
          </button>

          <div className="wallet-cluster">
            <article className="wallet-pill">
              <SpriteIcon name="coin" size={24} />
              <div>
                <span>金币</span>
                <strong>{formatNumber(coins)}</strong>
              </div>
            </article>
            <article className="wallet-pill">
              <SpriteIcon name="token" size={24} />
              <div>
                <span>活动币</span>
                <strong>{formatNumber(activityCoins)}</strong>
              </div>
            </article>
          </div>
        </div>
      </header>

      <main className={page.detail ? 'content-shell detail-mode' : 'content-shell'}>{renderPage()}</main>

      <nav className="bottom-nav" aria-label="主导航">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={page.tab === tab.id ? 'nav-item active' : 'nav-item'}
            onClick={() => openMainTab(tab.id)}
          >
            <SpriteIcon name={tab.sprite} size={24} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

export default App;
