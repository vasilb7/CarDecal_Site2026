import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, Trophy, HelpCircle, X, ShoppingBag, 
    ShieldCheck, BadgePercent, Clock, MoreVertical, 
    ChevronRight, Star, Info, Crown, Zap, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast/ToastProvider';

interface PointsRecord {
    id: string;
    amount: number;
    type: 'earn' | 'spend' | 'expire';
    description: string;
    created_at: string;
    expires_at: string | null;
    status: 'pending' | 'usable' | 'expired';
    orders: {
        order_number: string;
    } | null;
}

const WalletTab: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState({ usable: 0, pending: 0 });
    const [stats, setStats] = useState({ total_spent_year: 0, order_count_year: 0 });
    const [records, setRecords] = useState<PointsRecord[]>([]);
    const [activeModal, setActiveModal] = useState<'history' | 'challenges' | 'how-it-works' | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (user) fetchLoyaltyData();
    }, [user]);

    const fetchLoyaltyData = async () => {
        try {
            setLoading(true);
            const { data: ledger, error: ledgerError } = await supabase
                .from('loyalty_points_ledger')
                .select('*, orders(order_number)')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (ledgerError) throw ledgerError;

            // Calculate active and pending balances
            const usable = ledger
                ?.filter(r => r.status === 'usable')
                .reduce((acc, r) => acc + r.amount, 0) || 0;
            
            const pending = ledger
                ?.filter(r => r.status === 'pending')
                .reduce((acc, r) => acc + r.amount, 0) || 0;

            setBalance({ usable, pending });
            setRecords(ledger || []);

            // Fetch some stats (mocking or implementing simple query)
            const { count: orderCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .in('status', ['Delivered', 'Completed']);
            
            setStats({ total_spent_year: usable * 0.01, order_count_year: orderCount || 0 });

        } catch (error: any) {
            console.error('Error fetching loyalty data:', error);
            showToast('Грешка при зареждане на портфейла', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24 bg-black min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">Syncing Vault...</p>
                </div>
            </div>
        );
    }

    const totalCoins = balance.usable + balance.pending;
    const nextTierThreshold = 5000;
    const progressToNextTier = Math.min(100, (totalCoins / nextTierThreshold) * 100);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-10 font-sans selection:bg-red-600/30">
            {/* ─── Header Section ─── */}
            <header className="max-w-7xl mx-auto mb-12 sm:mb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-[0.4em] mb-3">Global Loyalty Portfolio</p>
                        <h1 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter leading-none">Vault</h1>
                    </div>
                </div>
            </header>

            {/* ─── Main Content Grid ─── */}
            <main className="max-w-7xl mx-auto space-y-8">
                
                {/* ─── Hero Vault Card ─── */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-[#121212] to-[#0a0a0a] border border-white/5 p-8 sm:p-16">
                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between h-full gap-12">
                        <div className="flex-1 space-y-12">
                            <div className="space-y-4">
                                <div className="flex items-baseline gap-4 sm:gap-6">
                                    <span className="text-[80px] sm:text-[140px] font-black leading-none tracking-tight">
                                        {balance.usable.toLocaleString()}
                                    </span>
                                    <span className="text-lg sm:text-2xl font-black text-zinc-500 uppercase tracking-widest">Coins</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="bg-white/5 border border-white/10 px-6 py-2">
                                        <span className="text-sm sm:text-lg font-black text-white tracking-widest leading-none">€{(balance.usable * 0.01).toFixed(2)}</span>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase ml-2">Value</span>
                                    </div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">100 Coins = €1</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full sm:w-64 self-end">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Tier Progress</p>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {nextTierThreshold - totalCoins} to Titanium
                                    </p>
                                </div>
                                <div className="h-2 bg-white/5 overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressToNextTier}%` }}
                                        className="h-full bg-gradient-to-r from-red-600 to-red-400"
                                     />
                                </div>
                            </div>
                        </div>

                        {/* Custom Menu Trigger */}
                        <div className="absolute top-8 right-8">
                             <button 
                                onClick={() => setShowMenu(true)}
                                className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/10 group"
                             >
                                <MoreVertical size={20} className="text-zinc-500 group-hover:text-white" />
                             </button>
                        </div>
                    </div>
                </div>

                {/* ─── Status Cards Grid ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                    {/* Usable Coins */}
                    <div className="bg-[#111] border-l-4 border-green-500 p-8 hover:bg-[#141414] transition-all">
                        <div className="flex items-center gap-3 mb-6 text-green-500">
                             <ShieldCheck size={20} />
                             <p className="text-[10px] font-black uppercase tracking-widest">Налични Coins</p>
                        </div>
                        <h4 className="text-5xl font-black mb-1">{balance.usable.toLocaleString()}</h4>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">Готови за ползване в количката</p>
                    </div>

                    {/* Pending Coins */}
                    <div className="bg-[#111] border-l-4 border-zinc-700 p-8 hover:bg-[#141414] transition-all">
                        <div className="flex items-center gap-3 mb-6 text-zinc-500">
                             <Clock size={20} />
                             <p className="text-[10px] font-black uppercase tracking-widest">Очакващи Coins</p>
                        </div>
                        <h4 className="text-5xl font-black text-zinc-400 mb-1">{balance.pending.toLocaleString()}</h4>
                        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wide leading-tight">Активират се след доставка</p>
                    </div>

                    {/* Expiration Alert Card */}
                    <div className="bg-gradient-to-br from-[#1a1313] to-[#111] border border-red-500/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:col-span-2 lg:col-span-1">
                        <div className="space-y-4 text-center sm:text-left">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Next Expiration</p>
                            <div className="space-y-1">
                                <h4 className="text-xl font-black uppercase leading-tight italic">0 Coins expire soon</h4>
                                <p className="text-[10px] font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">Use them to avoid balance deduction</p>
                            </div>
                        </div>
                        <button 
                            onClick={fetchLoyaltyData}
                            className="bg-white h-12 px-8 text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shrink-0"
                        >
                            Redeem Now
                        </button>
                    </div>
                </div>

                {/* ─── Bottom Sections Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-20">
                    
                    {/* Active Challenges Area */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Active Challenges</h2>
                            <button onClick={() => setActiveModal('challenges')} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-1 hover:text-white transition-colors">View All</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ObsidianChallengeCard 
                                img="obsidian_vault_challenge_1"
                                status="ACTIVE"
                                title="Midnight Tech Hunt"
                                desc="Purchase any 3 items between 12 AM and 4 AM."
                                progress={2}
                                target={3}
                                reward="+500 COINS"
                                color="red"
                            />
                            <ObsidianChallengeCard 
                                img="obsidian_vault_collector_art"
                                status="UPCOMING"
                                title="Obsidian Ritual"
                                desc="Maintain your order status for 3 consecutive months."
                                progress={0}
                                target={3}
                                reward="ELITE BADGE"
                                color="grey"
                                locked
                            />
                        </div>
                    </div>

                    {/* Vault Insights Area */}
                    <div className="lg:col-span-4 space-y-10">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Vault Insights</h2>
                        
                        <div className="space-y-6">
                            <InsightBox 
                                icon={Star}
                                color="amber"
                                title="Reward Milestone"
                                text="Purchase 10 items total to unlock Executive Launch Invite."
                                subText="Earn 500 more coins"
                            />
                            
                            <div className="bg-[#111] p-6 space-y-4">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Coins Activation Info</p>
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">Coins are activated 14 days after purchase completion to ensure security.</p>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">Once activated, coins remain valid for 180 days from the date of credit.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Collector Banners */}
                            <div className="relative group overflow-hidden aspect-[4/3] bg-zinc-900">
                                <img src="/obsidian_vault_collector_art.png" alt="art" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <div className="absolute bottom-8 left-8 right-8">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-2">Collector Series</p>
                                    <h4 className="text-2xl font-black leading-tight uppercase mb-4">Obsidian Meta-Art Drop</h4>
                                    <p className="text-[11px] text-zinc-400 font-medium line-clamp-2 uppercase">Redeem 10k Coins for early access to the generative collection.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Modals (History, Challenges, etc) ─── */}
            <AnimatePresence>
                {(activeModal || showMenu) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-30 bg-black border-b border-white/10 p-8 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-red-600/10 flex items-center justify-center text-red-500 shrink-0">
                                    {activeModal === 'history' ? <History size={24} /> : activeModal === 'challenges' ? <Trophy size={24} /> : showMenu ? <Zap size={24} /> : <HelpCircle size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] leading-none mb-1.5">
                                        {activeModal === 'history' ? 'Activity Ledger' : activeModal === 'challenges' ? 'Daily Quests' : showMenu ? 'Vault Menu' : 'CD Coin Guide'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">CD COINS</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => {setActiveModal(null); setShowMenu(false)}}
                                className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="max-w-4xl mx-auto p-6 sm:p-12 pb-24">
                            {/* Menu Mode */}
                            {showMenu && !activeModal && (
                                <div className="space-y-4 py-12">
                                     <LargeMenuBtn icon={History} title="Activity Ledger" desc="Review your full transaction history" onClick={() => setActiveModal('history')} />
                                     <LargeMenuBtn icon={Trophy} title="Visual Challenges" desc="Complete tasks to earn bonus rewards" onClick={() => setActiveModal('challenges')} />
                                     <LargeMenuBtn icon={HelpCircle} title="Как работят" desc="База знания и правила за активация" onClick={() => setActiveModal('how-it-works')} />
                                </div>
                            )}

                            {activeModal === 'history' && (
                                <div className="space-y-4">
                                    {records.length === 0 ? (
                                         <div className="text-center py-24 border border-white/5">
                                            <p className="text-zinc-700 font-black uppercase tracking-[0.5em] text-[10px]">Empty Record History</p>
                                         </div>
                                    ) : (
                                        records.map(record => (
                                            <ObsidianHistoryItem key={record.id} record={record} />
                                        ))
                                    )}
                                </div>
                            )}
                            
                            {activeModal === 'challenges' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <ObsidianChallengeCard 
                                        img="obsidian_vault_challenge_1"
                                        status="ACTIVE"
                                        title="Midnight Tech Hunt"
                                        desc="Purchase any 3 items between 12 AM and 4 AM."
                                        progress={2}
                                        target={3}
                                        reward="+500 COINS"
                                        color="red"
                                    />
                                    <ObsidianChallengeCard 
                                        img="obsidian_vault_collector_art"
                                        status="COMPLETE"
                                        title="Welcome Bonus"
                                        desc="Join the Obsidian Vault network."
                                        progress={1}
                                        target={1}
                                        reward="+20 COINS"
                                        color="green"
                                    />
                                </div>
                            )}

                            {activeModal === 'how-it-works' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 py-8">
                                    <BigStep num="01" title="Earn Rules" text="Всеки 1 евро похарчен за продукт ви носи 1 Coin. Доставката не се включва в натрупването." icon={ShoppingBag} />
                                    <BigStep num="02" title="Verification" text="Точките ви се активират автоматично само след като куриерът потвърди успешната доставка (статус Completed)." icon={ShieldCheck} />
                                    <BigStep num="03" title="Redemption" text="100 Coins се заменят директно за 1 евро отстъпка в края на поръчката ви. Няма минимална сума за ползване." icon={BadgePercent} />
                                    <BigStep num="04" title="Expiration" text="Всяка ваша точка е активна точно 180 дни. Изтичат автоматично, ако не бъдат използвани." icon={Clock} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Components ───────────────────────────────────────────────────────── */

const ObsidianChallengeCard: React.FC<{ 
    img: string, title: string, status: string, desc: string, progress: number, target: number, reward: string, color: string, locked?: boolean 
}> = ({ img, title, status, desc, progress, target, reward, color, locked }) => (
    <div className={`group relative bg-[#111] overflow-hidden ${locked ? 'opacity-50 grayscale' : ''}`}>
        <div className="aspect-video relative overflow-hidden">
            <img src={`/${img}.png`} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
                 <span className={`text-[9px] font-black px-2 py-1 ${status === 'ACTIVE' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-400'} uppercase tracking-widest`}>
                    {status}
                 </span>
            </div>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <h4 className="text-lg font-black uppercase tracking-tight leading-none">{title}</h4>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed uppercase">{desc}</p>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest tabular-nums">
                    <span className="text-zinc-600">Progress: {progress} / {target}</span>
                    <span className="text-white">{Math.round((progress/target)*100)}%</span>
                </div>
                <div className="h-1 bg-zinc-900 overflow-hidden">
                    <div className={`h-full ${color === 'red' ? 'bg-red-600' : color === 'green' ? 'bg-green-500' : 'bg-zinc-700'}`} style={{ width: `${(progress/target)*100}%` }} />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">{reward}</span>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
            </div>
        </div>
    </div>
);

const InsightBox: React.FC<{ icon: any, color: string, title: string, text: string, subText: string }> = ({ icon: Icon, color, title, text, subText }) => (
    <div className="bg-[#111] p-8 border-l-2 border-white/5 hover:border-red-600/30 transition-all group">
        <div className={`w-12 h-12 flex items-center justify-center mb-6 ${color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
            <Icon size={24} />
        </div>
        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-3">{title}</h4>
        <p className="text-[15px] font-black text-white leading-snug uppercase mb-4">{text}</p>
        <p className="text-[10px] font-bold text-zinc-500 uppercase italic">{subText}</p>
    </div>
);

const ObsidianHistoryItem: React.FC<{ record: PointsRecord }> = ({ record }) => {
    const isEarn = record.amount > 0;
    const date = new Date(record.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="flex items-center justify-between p-8 bg-[#111] hover:bg-[#141414] transition-all border-b border-white/5 group">
            <div className="flex items-center gap-6">
                <div className={`w-14 h-14 border flex items-center justify-center transition-all ${isEarn ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-white/5 text-zinc-500 bg-white/5'}`}>
                    {isEarn ? <Zap size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className={`text-lg font-black uppercase ${isEarn ? 'text-white' : 'text-zinc-500'}`}>
                            {isEarn ? `+${record.amount}` : record.amount} Coins
                        </span>
                        {record.orders?.order_number && (
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest border border-zinc-900 px-2 py-0.5">#{record.orders.order_number}</span>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        {record.description || 'Transaction'} • {date}
                    </p>
                </div>
            </div>
            <div className={`text-[9px] font-black uppercase px-3 py-1 border transition-all ${record.status === 'pending' ? 'text-amber-500 border-amber-500/20' : 'text-zinc-800 border-white/5'}`}>
                {record.status}
            </div>
        </div>
    );
};

const LargeMenuBtn: React.FC<{ icon: any, title: string, desc: string, onClick: () => void }> = ({ icon: Icon, title, desc, onClick }) => (
    <button onClick={onClick} className="w-full group bg-white/[0.02] border border-white/5 overflow-hidden flex items-stretch">
        <div className="w-24 bg-white/[0.03] flex items-center justify-center text-zinc-600 group-hover:text-red-500 transition-all border-r border-white/5">
            <Icon size={32} strokeWidth={1} />
        </div>
        <div className="flex-1 p-8 text-left space-y-2">
            <h4 className="text-xl font-black text-white uppercase tracking-tight">{title}</h4>
            <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-widest">{desc}</p>
        </div>
        <div className="w-20 flex items-center justify-center border-l border-white/5 group-hover:bg-red-600 transition-all">
             <ChevronRight size={24} className="text-white" />
        </div>
    </button>
);

const BigStep: React.FC<{ num: string, title: string, text: string, icon: any }> = ({ num, title, text, icon: Icon }) => (
    <div className="flex gap-8 items-start">
        <div className="shrink-0">
             <div className="w-20 h-20 bg-white/[0.03] border border-white/10 flex items-center justify-center text-white mb-4">
                <Icon size={32} strokeWidth={1.5} />
             </div>
             <span className="text-xs font-black text-red-500/60 tabular-nums uppercase">{num} Step</span>
        </div>
        <div className="pt-2">
            <h4 className="text-xl font-black text-white uppercase tracking-widest mb-4 italic">{title}</h4>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium uppercase">{text}</p>
        </div>
    </div>
);

export default WalletTab;
