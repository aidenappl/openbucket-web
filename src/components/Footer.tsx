import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-[var(--background-dark)] text-white py-4 min-h-[50px]">
      <div className="px-10 max-w-[var(--max-page-width)] mx-auto text-center">
        <div className="flex justify-between">
          <p className="text-[var(--text-light-secondary)]">
            &copy; {new Date().getFullYear()} OpenBucket
          </p>
          <p className="text-[var(--text-light-secondary)]">
            Project by{" "}
            <Link
              href="https://aidenappleby.com"
              target="_blank"
              className="text-white font-medium"
            >
              Aiden Appleby
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
