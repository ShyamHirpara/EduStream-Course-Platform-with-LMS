import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Github, Twitter,
  Linkedin, Heart, Mail, ExternalLink,
} from 'lucide-react';

const LINKS = {
  platform: [
    { label: 'Browse Courses', to: '/courses' },
    { label: 'Login',          to: '/login' },
    { label: 'Sign Up',        to: '/register' },
    { label: 'Dashboard',      to: '/dashboard' },
  ],
  // "to" = internal React Router route | "href" = external URL
  learn: [
    { label: 'How It Works',    to: '/'           },   // Home page (hero / feature section)
    { label: 'For Instructors', to: '/register'   },   // Register & choose Instructor role
    { label: 'For Students',    to: '/courses'    },   // Browse the course catalog
    { label: 'Assessments',     to: '/dashboard'  },   // Student dashboard shows assessment-gated lessons
  ],
  tech: [
    { label: 'Django REST',  href: 'https://www.django-rest-framework.org/', ext: true },
    { label: 'React + Vite', href: 'https://vitejs.dev/', ext: true },
    { label: 'Cloudinary',   href: 'https://cloudinary.com/', ext: true },
    { label: 'PostgreSQL',   href: 'https://www.postgresql.org/', ext: true },
  ],
};

const SOCIALS = [
  // ── Replace each href value with your own profile / contact URL ──────────
  // GitHub  → e.g. 'https://github.com/YOUR_USERNAME'
  { Icon: Github,   href: 'https://github.com/ShyamHirpara',       label: 'GitHub' },
  // X (Twitter) → e.g. 'https://x.com/YOUR_HANDLE'
  { Icon: Twitter,  href: 'https://x.com/SHYMHRPR1',            label: 'X (Twitter)' },
  // LinkedIn → e.g. 'https://linkedin.com/in/YOUR_PROFILE'
  { Icon: Linkedin, href: 'https://linkedin.com/in/Shyam-hirpara',     label: 'LinkedIn' },
  // Email → 'mailto:your@email.com'
  { Icon: Mail,     href: 'mailto:hiraparashyam666@email.com',     label: 'Email' },
];


export default function Footer() {
  return (
    <footer className="footer">
      {/* ── glow bar ── */}
      <div className="footer__glow-bar" aria-hidden="true" />

      <div className="container">
        {/* ── Main grid ── */}
        <div className="footer__grid">

          {/* Brand column */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <GraduationCap size={22} />
              EduStream
            </Link>
            <p className="footer__tagline">
              A modern Learning Management System where instructors craft
              world-class courses and students grow through structured,
              assessment-driven education.
            </p>
            <div className="footer__socials">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} className="footer__social-btn" target="_blank" rel="noreferrer">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div className="footer__col">
            <h4 className="footer__col-title"><BookOpen size={13} /> Platform</h4>
            <ul>
              {LINKS.platform.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn links */}
          <div className="footer__col">
            <h4 className="footer__col-title"><GraduationCap size={13} /> Learn</h4>
            <ul>
              {LINKS.learn.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div className="footer__col">
            <h4 className="footer__col-title">⚙ Tech Stack</h4>
            <ul>
              {LINKS.tech.map(({ label, href, ext }) => (
                <li key={label}>
                  <a href={href} className="footer__link footer__link--ext"
                     target={ext ? '_blank' : undefined} rel="noreferrer">
                    {label} {ext && <ExternalLink size={11} />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © {new Date().getFullYear()} EduStream. Built with&nbsp;
            <Heart size={12} className="footer__heart" />
            &nbsp;using Django REST + React.
          </p>
        </div>
      </div>
    </footer>
  );
}
