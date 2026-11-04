import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function AppFrame({ children }: { children: ReactNode }) {
  return <div className="app-frame">{children}</div>;
}

export function HeaderBar({ children }: { children: ReactNode }) {
  return <div className="shell header-inner">{children}</div>;
}

export function Account({ children }: { children: ReactNode }) {
  return <div className="account">{children}</div>;
}

export function Screen({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={className} {...props}>
      {children}
    </section>
  );
}

export function Button({ type = 'button', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx('button', className)} {...props} />;
}

export function ButtonLink({ className, ...props }: LinkProps) {
  return <Link className={cx('button', className)} {...props} />;
}

export function TextButton({ type = 'button', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx('text-button', className)} {...props} />;
}

export function Card({
  as: Tag = 'section',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: 'section' | 'article' }) {
  return (
    <Tag className={cx('card', className)} {...props}>
      {children}
    </Tag>
  );
}

export function Banner({
  quiet = false,
  className,
  role,
  ...props
}: HTMLAttributes<HTMLDivElement> & { quiet?: boolean }) {
  return <div className={cx('banner', quiet && 'quiet', className)} role={role ?? (quiet ? undefined : 'alert')} {...props} />;
}

export function Kicker(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="kicker" {...props} />;
}

export function Lede(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="lede" {...props} />;
}

export function Fine(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="fine" {...props} />;
}

export function Hint(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="hint" {...props} />;
}

export function Status(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="status" role="status" {...props} />;
}

export function TitleRow({ children }: { children: ReactNode }) {
  return <div className="title-row">{children}</div>;
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="actions">{children}</div>;
}

export function Split({ children }: { children: ReactNode }) {
  return <div className="split">{children}</div>;
}

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <label className="picker" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function PointList({ tone, points }: { tone: 'covered' | 'missing'; points: string[] }) {
  return (
    <ul className={`points points-${tone}`}>
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose">{children}</div>;
}
