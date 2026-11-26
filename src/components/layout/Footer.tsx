import Image from "next/image";
import Link from "next/link";

const exploreLinks = [
  { label: "About QuestGo", href: "/#home" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Safety Center", href: "/#safety" },
  { label: "Contact Support", href: "mailto:support@cit.edu" }, // Opens email client instead of 404
];

const legalLinks = [
  { label: "Terms of Service", href: "/#how-it-works" }, // Routed to main anchors to avoid 404s
  { label: "Privacy Policy", href: "/#safety" },
];

export const Footer = () => {
  return (
    <footer className="bg-dark text-white">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 px-6 md:px-16 py-12 md:py-16 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-4 max-w-sm">
          <Link href="/#home" className="inline-flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="QuestGo logo"
              width={36}
              height={36}
              className="rounded-[10px] object-contain"
            />
            <span className="font-bold text-xl tracking-tight text-white">
              QuestGo
            </span>
          </Link>
          <p className="font-normal text-sm leading-relaxed text-gold-bright">
            Turn Tasks Into Opportunities. Cebu Institute of Technology -
            University student-to-student peer marketplace.
          </p>
        </div>

        <div className="flex flex-wrap gap-16 md:gap-24">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-xs tracking-[0.14em] uppercase text-white">
              Explore
            </h3>
            <ul className="flex flex-col gap-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-medium text-sm text-gray-400 hover:text-gold-bright transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-xs tracking-[0.14em] uppercase text-white">
              Legal
            </h3>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-medium text-sm text-gray-400 hover:text-gold-bright transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2a2a2a] px-6 md:px-16 py-5 flex flex-col md:flex-row items-center justify-between gap-3 max-w-screen-2xl mx-auto">
        <p className="font-normal text-xs md:text-sm text-gold-bright">
          © 2026 QuestGo. Designed for the CIT-U student community.
        </p>
        <p className="font-medium text-xs md:text-sm text-gray-400">
          Cebu Institute of Technology - University
        </p>
      </div>
    </footer>
  );
};

export default Footer;