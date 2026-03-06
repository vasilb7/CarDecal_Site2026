import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  Share2,
} from "lucide-react";
import { useToast } from "../hooks/useToast";

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productUrl: string;
}

interface ShareLink {
  name: string;
  color: string;
  shape: "circle" | "squircle";
  icon: React.ReactNode;
  url?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const iconWrapClass = "w-7 h-7";
const iconWrapLargeClass = "w-full h-full";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className={iconWrapClass + " fill-white"} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const EmailIcon = () => (
  <svg
    viewBox="0 0 72 72"
    className="w-10 h-10"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M18,26.1623226 L18,46.5476129 C18,47.6566452 18.8117419,48.5554839 19.9300645,48.5554839 L51.7447742,48.5554839 C52.8619355,48.5554839 53.6748387,47.6461935 53.6748387,46.5476129 L53.6748387,26.1623226 C53.6748387,24.9452903 52.947871,24 51.7447742,24 L19.9300645,24 C18.6805161,24 18,24.9685161 18,26.1623226 M20.9334194,27.9379355 C20.9334194,27.4467097 21.2307097,27.1656774 21.7056774,27.1656774 C21.9994839,27.1656774 33.560129,34.4910968 34.2603871,34.9207742 L36.0696774,36.0460645 C36.6433548,35.6616774 37.2193548,35.3330323 37.8139355,34.9347097 C39.0274839,34.1589677 49.8251613,27.1656774 50.1224516,27.1656774 C50.5985806,27.1656774 50.8947097,27.4467097 50.8947097,27.9379355 C50.8947097,28.4581935 49.8925161,28.9749677 49.239871,29.3732903 C45.1393548,31.8723871 41.04,34.5967742 36.980129,37.1887742 C36.7432258,37.3490323 36.2845161,37.6916129 35.9407742,37.6393548 C35.5575484,37.580129 23.7936774,30.0224516 21.6534194,28.7636129 C21.3317419,28.5743226 20.9334194,28.4012903 20.9334194,27.9379355"
      fill="#FFF"
    />
  </svg>
);



const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" className={iconWrapClass + " fill-white"} aria-hidden="true">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.604 0 12.017 0z" />
  </svg>
);

const MessengerIcon = () => (
  <svg
    viewBox="-117.76 -117.76 747.52 747.52"
    className={iconWrapLargeClass}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g transform="translate(0,0), scale(1)">
      <rect
        x="-117.76"
        y="-117.76"
        width="747.52"
        height="747.52"
        rx="373.76"
        fill="#0084ff"
      />
    </g>
    <path
      d="M257 93c-88.918 0-161 67.157-161 150 0 47.205 23.412 89.311 60 116.807V417l54.819-30.273C225.449 390.801 240.948 393 257 393c88.918 0 161-67.157 161-150S345.918 93 257 93zm16 202l-41-44-80 44 88-94 42 44 79-44-88 94z"
      fill="#ffffff"
    />
  </svg>
);

const ViberIcon = () => (
  <svg
    enableBackground="new 0 0 128 128"
    viewBox="0 0 128 128"
    className={iconWrapClass + " fill-white"}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g>
      <g>
        <rect clipRule="evenodd" fill="none" fillRule="evenodd" height="128" width="128" />
        <path
          clipRule="evenodd"
          d="M71.4,44.764c2.492,0.531,4.402,1.478,6.034,3.006    c2.1,1.983,3.251,4.383,3.757,7.831c0.342,2.248,0.202,3.132-0.595,3.865c-0.746,0.682-2.125,0.707-2.96,0.063    c-0.607-0.455-0.797-0.935-0.936-2.236c-0.164-1.731-0.468-2.943-0.987-4.067c-1.113-2.387-3.074-3.625-6.388-4.029    c-1.556-0.19-2.024-0.366-2.53-0.96c-0.924-1.099-0.569-2.88,0.708-3.537c0.481-0.24,0.683-0.265,1.746-0.202    C69.908,44.536,70.882,44.65,71.4,44.764z M68.706,35.227c7.679,1.124,13.624,4.686,17.521,10.471    c2.189,3.259,3.555,7.086,4.023,11.191c0.164,1.503,0.164,4.244-0.013,4.699c-0.165,0.429-0.696,1.01-1.151,1.25    c-0.493,0.253-1.543,0.227-2.125-0.076c-0.974-0.493-1.265-1.276-1.265-3.398c0-3.271-0.848-6.72-2.315-9.398    c-1.67-3.057-4.099-5.583-7.059-7.339c-2.543-1.516-6.3-2.64-9.728-2.918c-1.24-0.101-1.923-0.354-2.391-0.897    c-0.721-0.821-0.797-1.933-0.19-2.855C64.67,34.937,65.682,34.772,68.706,35.227z M38.914,27.434    c0.443,0.152,1.126,0.505,1.518,0.758c2.403,1.592,9.095,10.143,11.284,14.412c1.252,2.438,1.67,4.244,1.278,5.583    c-0.405,1.44-1.075,2.198-4.074,4.61c-1.202,0.972-2.328,1.97-2.505,2.236c-0.455,0.657-0.822,1.945-0.822,2.855    c0.013,2.109,1.379,5.937,3.175,8.88c1.391,2.286,3.883,5.216,6.35,7.465c2.897,2.653,5.452,4.459,8.337,5.886    c3.707,1.844,5.971,2.311,7.628,1.541c0.417-0.19,0.86-0.442,0.999-0.556c0.126-0.114,1.101-1.301,2.163-2.615    c2.049-2.577,2.517-2.994,3.922-3.474c1.784-0.606,3.605-0.442,5.44,0.493c1.392,0.72,4.428,2.602,6.388,3.966    c2.581,1.806,8.096,6.303,8.843,7.2c1.315,1.617,1.543,3.688,0.658,5.975c-0.936,2.412-4.579,6.934-7.122,8.867    c-2.302,1.743-3.934,2.412-6.085,2.513c-1.771,0.088-2.505-0.063-4.769-0.998C63.76,95.718,49.579,84.805,38.32,69.811    c-5.882-7.831-10.361-15.953-13.422-24.378c-1.784-4.913-1.872-7.048-0.405-9.562c0.633-1.061,3.327-3.688,5.288-5.153    c3.264-2.425,4.769-3.322,5.971-3.575C36.574,26.966,38.004,27.105,38.914,27.434z M67.833,26.07    c4.352,0.543,7.868,1.591,11.727,3.474c3.795,1.857,6.224,3.613,9.437,6.808c3.011,3.019,4.681,5.305,6.452,8.854    c2.467,4.951,3.871,10.838,4.111,17.317c0.089,2.21,0.025,2.703-0.481,3.335c-0.961,1.225-3.074,1.023-3.795-0.354    c-0.228-0.455-0.291-0.846-0.367-2.615c-0.127-2.716-0.316-4.471-0.696-6.568c-1.493-8.223-5.44-14.791-11.74-19.503    c-5.25-3.941-10.677-5.861-17.786-6.278c-2.404-0.139-2.821-0.227-3.365-0.644c-1.012-0.796-1.063-2.665-0.089-3.537    c0.595-0.543,1.012-0.619,3.074-0.556C65.392,25.842,66.973,25.969,67.833,26.07z M64,0c35.346,0,64,28.654,64,64    s-28.654,64-64,64S0,99.346,0,64S28.654,0,64,0z"
          fillRule="evenodd"
        />
      </g>
    </g>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className={iconWrapClass + " fill-white"} aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const MessagesIcon = () => (
  <svg viewBox="0 0 24 24" className={iconWrapClass + " fill-white"} aria-hidden="true">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
  </svg>
);

const TelegramIcon = () => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    className={iconWrapLargeClass}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z"
      fill="url(#telegramPaint0)"
    />
    <path
      d="M8.93822 25.174C11.7438 23.6286 14.8756 22.3388 17.8018 21.0424C22.836 18.919 27.8902 16.8324 32.9954 14.8898C33.9887 14.5588 35.7734 14.2351 35.9484 15.7071C35.8526 17.7907 35.4584 19.8621 35.188 21.9335C34.5017 26.4887 33.7085 31.0283 32.935 35.5685C32.6685 37.0808 30.774 37.8637 29.5618 36.8959C26.6486 34.9281 23.713 32.9795 20.837 30.9661C19.8949 30.0088 20.7685 28.6341 21.6099 27.9505C24.0093 25.5859 26.5539 23.5769 28.8279 21.0901C29.4413 19.6088 27.6289 20.8572 27.0311 21.2397C23.7463 23.5033 20.5419 25.9051 17.0787 27.8945C15.3097 28.8683 13.2479 28.0361 11.4797 27.4927C9.89428 26.8363 7.57106 26.175 8.93806 25.1741L8.93822 25.174Z"
      fill="white"
    />
    <defs>
      <linearGradient
        id="telegramPaint0"
        x1="18.0028"
        y1="2.0016"
        x2="6.0028"
        y2="30"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#37AEE2" />
        <stop offset="1" stopColor="#1E96C8" />
      </linearGradient>
    </defs>
  </svg>
);

const ShareProductModal: React.FC<ShareProductModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  productUrl,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const [showLeftScroll, setShowLeftScroll] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
      setShowLeftScroll(scrollLeft > 5);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(handleScroll, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  const scrollLeftBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };

  const encodedUrl = encodeURIComponent(productUrl);
  const encodedTitle = encodeURIComponent(productTitle);
  const shareText = `${productTitle} ${productUrl}`;
  const encodedShareText = encodeURIComponent(shareText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      showToast("Линкът е копиран!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Грешка при копиране", "error");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          url: productUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const smsUrl = isIOS
    ? `sms:&body=${encodedShareText}`
    : `sms:?body=${encodedShareText}`;

  const shareLinks: ShareLink[] = [
    {
      name: "WhatsApp",
      color: "bg-[#25D366]",
      shape: "circle",
      icon: <WhatsAppIcon />,
      url: `https://wa.me/?text=${encodedShareText}`,
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2]",
      shape: "circle",
      icon: <FacebookIcon />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X",
      color: "bg-black",
      shape: "circle",
      icon: <XIcon />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Имейл",
      color: "bg-black",
      shape: "circle",
      icon: <EmailIcon />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedShareText}`,
    },

    {
      name: "Pinterest",
      color: "bg-[#E60023]",
      shape: "circle",
      icon: <PinterestIcon />,
      url: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
    },
    {
      name: "Messenger",
      color: "bg-transparent",
      shape: "circle",
      icon: <MessengerIcon />,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        handleNativeShare();
      },
    },
    {
      name: "Viber",
      color: "bg-[#7360F2]",
      shape: "circle",
      icon: <ViberIcon />,
      url: `viber://forward?text=${encodedShareText}`,
    },
    {
      name: "Discord",
      color: "bg-[#5865F2]",
      shape: "circle",
      icon: <DiscordIcon />,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        handleNativeShare();
      },
    },
    {
      name: "Съобщения",
      color: "bg-[#34B7F1]",
      shape: "circle",
      icon: <MessagesIcon />,
      url: smsUrl,
    },
    {
      name: "Telegram",
      color: "bg-transparent",
      shape: "circle",
      icon: <TelegramIcon />,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[400] backdrop-blur-sm"
          />

          {/* Desktop Version */}
          <div className="hidden lg:flex fixed inset-0 z-[401] items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#1f1f1f] w-full max-w-[440px] rounded-3xl border border-white/10 shadow-2xl pointer-events-auto flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">
                  Споделяне
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 pb-2 relative group/scroll">
                {showLeftScroll && (
                  <div className="absolute left-0 top-0 bottom-6 w-20 bg-gradient-to-r from-[#1f1f1f] via-[#1f1f1f]/80 to-transparent pointer-events-none flex items-center justify-start pl-3 z-10">
                    <button
                      onClick={scrollLeftBtn}
                      className="w-10 h-10 bg-[#151515] text-white rounded-full flex items-center justify-center shadow-lg border border-white/10 pointer-events-auto hover:bg-[#252525] transition-colors mb-2"
                    >
                      <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                  </div>
                )}

                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="flex gap-4 overflow-x-auto no-scrollbar pt-4 pb-4 snap-x snap-mandatory scroll-smooth"
                >
                  {shareLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url || "#"}
                      onClick={link.onClick}
                      target={link.url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 min-w-[80px] snap-center group"
                    >
                      <div
                        className={`w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95 shadow-lg overflow-hidden ${
                          link.shape === "circle" ? "rounded-full" : "rounded-[1.2rem]"
                        } ${link.color}`}
                      >
                        {link.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white">
                        {link.name}
                      </span>
                    </a>
                  ))}
                </div>

                {showRightScroll && (
                  <div className="absolute right-0 top-0 bottom-6 w-20 bg-gradient-to-l from-[#1f1f1f] via-[#1f1f1f]/80 to-transparent pointer-events-none flex items-center justify-end pr-3 z-10">
                    <button
                      onClick={scrollRight}
                      className="w-10 h-10 bg-[#151515] text-white rounded-full flex items-center justify-center shadow-lg border border-white/10 pointer-events-auto hover:bg-[#252525] transition-colors mb-2"
                    >
                      <ChevronRight size={20} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>

              <div className="px-6 pb-8">
                <div className="border border-white/10 rounded-2xl p-1 pl-5 flex items-center bg-black/40 justify-between group focus-within:border-blue-500/50 transition-all duration-300">
                  <input
                    type="text"
                    readOnly
                    value={productUrl}
                    className="bg-transparent text-white/80 text-sm outline-none w-full truncate mr-3 font-medium"
                  />
                  <button
                    onClick={handleCopy}
                    className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2"
                  >
                    {copied ? <Check size={16} /> : "Копиране"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Bottom Sheet Version */}
          <div className="lg:hidden fixed inset-0 z-[401] flex flex-col justify-end pointer-events-none">
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  onClose();
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ 
                type: "spring", 
                damping: 40, 
                stiffness: 350, 
                mass: 1
              }}
              className="bg-[#0A0A0A] w-full max-h-[85vh] rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] touch-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-8 py-8">
                <h3 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
                  Сподели
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 bg-zinc-900/80 backdrop-blur-md flex items-center justify-center text-white rounded-full border border-white/10 active:scale-90 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="px-8 pb-8">
                  <div className="flex gap-5 overflow-x-auto no-scrollbar pt-4 pb-2 -mx-4 px-4 snap-x snap-mandatory">
                    {shareLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url || "#"}
                        onClick={link.onClick}
                        target={link.url ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-3 min-w-[80px] snap-center active:scale-95 transition-transform"
                      >
                        <div
                          className={`w-[72px] h-[72px] flex items-center justify-center shadow-2xl overflow-hidden ${
                            link.shape === "circle" ? "rounded-full" : "rounded-[24px]"
                          } ${link.color}`}
                        >
                          {link.icon}
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 text-center line-clamp-1 w-full uppercase tracking-widest px-1">
                          {link.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Mobile action list like screenshot 2 */}
                <div className="px-6 pb-10 flex flex-col gap-7">
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-5 py-1 bg-transparent active:scale-[0.99] transition-transform"
                  >
                    <div className="w-20 h-20 bg-[#3A3A3C] rounded-full flex items-center justify-center text-white shrink-0">
                      <Copy size={34} strokeWidth={2.1} />
                    </div>
                    <span className="text-[28px] leading-none font-normal text-white text-left">
                      Копиране на връзката
                    </span>
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center gap-5 py-1 bg-transparent active:scale-[0.99] transition-transform"
                  >
                    <div className="w-20 h-20 bg-[#3A3A3C] rounded-full flex items-center justify-center text-white shrink-0">
                      <Share2 size={34} strokeWidth={2.1} />
                    </div>
                    <span className="text-[28px] leading-none font-normal text-white text-left">
                      Споделяне с други приложения
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareProductModal;