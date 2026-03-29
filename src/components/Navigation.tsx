import Link from "next/link";
import Image from "next/image";
import Dropdown, { DropdownItem } from "./Dropdown";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveSession,
  selectCurrentSession,
  selectAllSessions,
} from "@/store/slices/sessionSlice";
import {
  selectIsLogged,
  selectIsLoading,
  selectUser,
} from "@/store/slices/authSlice";
import { fortaLogin, openBucketLogout } from "@/services/auth.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";

const Navigation = () => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const currentSession = useSelector(selectCurrentSession);
  const sessions = useSelector(selectAllSessions);
  const isLogged = useSelector(selectIsLogged);
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);

  const handleLogout = () => {
    openBucketLogout();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const items = sessions.map((session) => ({
        id: `${session.endpoint}{${session.bucket}}`,
        label: session.nickname || session.bucket,
        onClick: () => dispatch(setActiveSession(session)),
      }));
      setDropdownItems([
        ...items,
        {
          label: "Create New Session",
          variant: "action" as const,
          href: "/bucket",
        },
      ]);
    }
  }, [sessions, dispatch]);

  return (
    <nav className="w-full h-[80px] bg-[var(--background)]">
      <div className="flex items-center justify-between h-full px-10 w-full">
        <Link href="/" className="flex items-center">
          <Image
            src="/OpemBucket-Logo-Transparent-Dark.svg"
            alt="OpenBucket"
            width={52}
            height={52}
            priority
          />
          <span className="text-2xl font-bold text-gray-900">OpenBucket</span>
        </Link>
        <div className="flex gap-4 items-center">
          {dropdownItems.length > 0 && (
            <>
              <Link
                className="text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                href={"/"}
              >
                Explorer
              </Link>
              <Link
                className="text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                href={"/bucket"}
              >
                Sessions
              </Link>
              <Dropdown
                items={dropdownItems}
                value={
                  currentSession
                    ? `${currentSession.endpoint}{${currentSession.bucket}}`
                    : undefined
                }
              />
            </>
          )}
          {!isLoading &&
            (isLogged ? (
              <div ref={userMenuRef} className="relative flex items-center">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  {user?.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                      {(user?.name || user?.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  {user?.name || user?.display_name || user?.email}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-[10px] text-slate-400 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1">
                    <a
                      href="https://forta.appleby.cloud"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Manage Account
                    </a>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={fortaLogin}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Sign in
              </button>
            ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
