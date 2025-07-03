import Link from "next/link";

const Navigation = () => {
  return (
    <nav className="w-full h-[80px] bg-[var(--background)]">
      <div className="container flex flex-wrap items-center justify-between h-full px-10">
        <Link href="/" className="flex items-center">
          <span className="self-center text-3xl font-semibold whitespace-nowrap text-gray-800">
            OpenBucket
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
