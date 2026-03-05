import React from 'react';
import { MessageSquareWarning } from 'lucide-react';

interface ErrorStateCardProps {
    title?: string;
    description?: string;
    buttonText?: string;
}

const ErrorStateCard: React.FC<ErrorStateCardProps> = ({
    title = "Нещо не изглежда наред?",
    description = "Ако смяташ, че това е техническа грешка, моля да ни уведомиш.",
    buttonText = "Докладвай проблем"
}) => {
    const handleReportBug = () => {
        window.dispatchEvent(new Event('open-bug-report'));
    };

    return (
        <div className="p-6 md:p-8 rounded-2xl bg-red-500/5 border border-red-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-2xl mx-auto my-8">
            <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 mx-auto sm:mx-0">
                    <MessageSquareWarning size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                    <p className="text-sm text-white/50">{description}</p>
                </div>
            </div>
            <button 
                onClick={handleReportBug}
                className="shrink-0 px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 font-semibold text-sm transition-all whitespace-nowrap"
            >
                {buttonText}
            </button>
        </div>
    );
};

export default ErrorStateCard;
