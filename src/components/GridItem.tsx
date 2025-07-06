import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faEllipsisV,
  faQuestionCircle,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type GridItemProps = {
  title: string;
  subtitle?: string;
  icon?: IconProp;
  onClick?: () => void;
};

const GridItem = ({ title, subtitle, icon, onClick }: GridItemProps) => {
  return (
    <div
      className="cursor-pointer hover:bg-[#eeeeee] hover:shadow-sm transition-[0.2s] bg-[#f6f6f6] rounded-md w-full flex flex-col h-[150px] md:h-[175px] lg:h-[200px] border border-gray-200 overflow-hidden select-none cursor-pointer"
      onClick={onClick}
    >
      {/* Icon/Image Preview */}
      <div className="flex w-full h-full items-center justify-center text-slate-800">
        {icon ? (
          <FontAwesomeIcon className="text-5xl" icon={icon} />
        ) : (
          <FontAwesomeIcon className="text-5xl" icon={faQuestionCircle} />
        )}
      </div>
      {/* Information Ticker */}
      <div className="flex w-full h-[50px] bg-white items-center p-3 justify-between">
        {/* Icon */}
        <div className="pr-3 text-slate-800 flex-shrink-0">
          {icon ? (
            <FontAwesomeIcon className="text-2xl" icon={icon} />
          ) : (
            <FontAwesomeIcon className="text-2xl" icon={faQuestionCircle} />
          )}
        </div>

        {/* Information */}
        <div className="flex flex-col text-sm leading-none gap-0.5 flex-grow overflow-hidden">
          <span className="font-medium truncate">{title}</span>
          {subtitle && (
            <span className="text-gray-500 truncate">{subtitle}</span>
          )}
        </div>

        {/* Controls */}
        <div className="w-[15px] h-[30px] flex items-center justify-end flex-shrink-0 group">
          <FontAwesomeIcon
            icon={faEllipsisV}
            className="text-gray-400 group-hover:text-gray-800 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
export default GridItem;
