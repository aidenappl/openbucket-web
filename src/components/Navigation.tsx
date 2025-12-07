import Link from "next/link";
import Dropdown, { DropdownItem } from "./Dropdown";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveSession,
  selectCurrentSession,
  selectAllSessions,
} from "@/store/slices/sessionSlice";

const Navigation = () => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const dispatch = useDispatch();
  const currentSession = useSelector(selectCurrentSession);
  const sessions = useSelector(selectAllSessions);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const items = sessions.map((session) => ({
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
          <span className="self-center text-3xl font-semibold whitespace-nowrap text-gray-800">
            OpenBucket
          </span>
        </Link>
        {dropdownItems.length > 0 && (
          <div className="flex gap-4 items-center">
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
              value={currentSession?.nickname || currentSession?.bucket}
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
