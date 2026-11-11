'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Brand from './Brand';
import { LocalTime, RollingText, TechnicalToggle } from './Experience';
import { company } from '../lib/site-info.mjs';
import usePopup from '../lib/use-popup';
const destinations = [
  { name: 'Manufacturing', id: 'studio', image: '/images/laser-bed.webp', caption: 'Manufacturing capabilities' },
  { name: 'Our approach', id: 'approach', image: '/images/product-previews/cabinets.jpg', caption: 'From requirements to fabrication' },
  { name: 'Equipment', id: 'products', image: '/images/product-previews/worktable.jpg', caption: 'Equipment concepts' },
  { name: 'Contact', id: 'enquiry-form', image: '/images/product-previews/sink.jpg', caption: 'Let’s shape your next project.' },
];
const chapters = [{ id: 'manufacturing', name: 'Introduction' }, { id: 'about', name: 'Company' }, { id: 'approach', name: 'Approach' }, { id: 'studio', name: 'Capabilities' }, { id: 'products', name: 'Equipment' }, { id: 'enquiry', name: 'Contact' }];
function Navigation({ onClose, rootLinks, enquiryHref }) {
  const root = useRef(null);
  const [preview, setPreview] = useState(2);
  usePopup(root, onClose);
  function navigate(event, id) {
    onClose();
    if (rootLinks) return;
    event.preventDefault();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.getElementById(id);
      history.pushState(null, '', `#${id}`);
      target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      target?.focus({ preventScroll: true });
    }));
  }
  return <div ref={root} id="primary-navigation" className="navigation-overlay" role="dialog" aria-modal="true" aria-label="Site navigation" tabIndex={-1}>
    <div className="navigation-top"><Brand homeHref={rootLinks ? '/' : '#home'}/><a className="button button-green nav-quote" href={enquiryHref} onClick={onClose}>Request a quote <ArrowUpRight size={18}/></a><button type="button" className="navigation-close" onClick={onClose} aria-label="Close menu"><span>Close</span><X size={27} strokeWidth={1.5}/></button></div>
    <div className="navigation-content"><nav aria-label="Main navigation">{destinations.map((item, index) => <a key={item.id} href={`${rootLinks ? '/' : ''}#${item.id}`} onClick={event => navigate(event, item.id)} onMouseEnter={() => setPreview(index)} onFocus={() => setPreview(index)} className={preview === index ? 'is-previewed' : ''}><span className="navigation-number">0{index + 1}</span><span>{item.name}</span><ArrowUpRight size={40} strokeWidth={1}/></a>)}</nav><figure className="navigation-preview">{destinations.map((item, index) => <img key={item.id} src={item.image} alt="" className={preview === index ? 'active' : ''} decoding="async"/>)}<figcaption>{destinations[preview].caption}</figcaption></figure></div>
    <div className="navigation-bottom"><a href={`mailto:${company.email}`}>{company.email}</a><a href={`tel:${company.telephone}`}>{company.telephoneLabel}</a><span>{company.location}</span><TechnicalToggle/></div>
  </div>;
}
export default function Header({ rootLinks = false, enquiryHref = rootLinks ? '/#enquiry-form' : '#enquiry-form', chapterName = 'Information' }) {
  const [open, setOpen] = useState(false);
  const [chapter, setChapter] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (rootLinks) return;
    let frame = 0;
    const update = () => { frame = 0; const line = window.innerHeight * 0.38; let current = 0; chapters.forEach((item, index) => { if (document.getElementById(item.id)?.getBoundingClientRect().top <= line) current = index; }); setChapter(current); };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [rootLinks]);
  return <><header className="site-header experience-header"><a className="skip-link" href={rootLinks ? '#page-content' : '#studio'}>Skip to content</a><div className="header-inner" inert={open ? true : undefined}><Brand homeHref={rootLinks ? '/' : '#home'}/><div className="header-chapter"><span>{rootLinks ? '↳' : `0${chapter}`}</span><span>{rootLinks ? chapterName : chapters[chapter].name}</span><i/></div><div className="header-tools"><LocalTime/><TechnicalToggle/><a className="button button-green header-quote" href={enquiryHref} aria-label="Request a quote"><RollingText>Request a quote</RollingText><ArrowUpRight size={17} strokeWidth={1.5}/></a><button type="button" className="menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="primary-navigation"><span>Menu</span><Menu size={25} strokeWidth={1.5}/></button></div></div></header>{open && <Navigation onClose={close} rootLinks={rootLinks} enquiryHref={enquiryHref}/>}</>;
}
