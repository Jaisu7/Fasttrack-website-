import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, Mail, Phone, Copy, Download, ExternalLink, MapPin, CheckCircle2, Paperclip } from 'lucide-react';
import { composeEnquiryDetails, prepareEnquiry } from '../lib/enquiry.mjs';
import Brand from './Brand';
import { products } from '../lib/fasttrack-data';
import { company } from '../lib/site-info.mjs';
import { TechnicalToggle } from './Experience';

export default function Enquiry({ requirement, setRequirement, configurationDetails = '', onClearConfiguration, onReplayIntro }) {
  const form = useRef(null), requestId = useRef(null);
  const [draft,setDraft] = useState(null), [status,setStatus] = useState(''), [error,setError] = useState(''), [pending,setPending] = useState(false), [receipt,setReceipt] = useState(null), [files,setFiles] = useState([]), [details,setDetails] = useState('');
  useEffect(()=>{setDraft(null);setReceipt(null);setError('');setStatus('');requestId.current=null;},[configurationDetails]);
  useEffect(()=>{setReceipt(null);setError('');setStatus('');requestId.current=null;},[requirement]);
  function changed(){setDraft(null);setReceipt(null);setError('');setStatus('');requestId.current=null;}
  async function submit(event){
    event.preventDefault(); if(pending||receipt)return;
    const body=new FormData(event.currentTarget);
    const combinedDetails=composeEnquiryDetails(body.get('details'),configurationDetails);
    if(combinedDetails.length>30000){setError('Please shorten the project notes. The notes and selected specification can contain up to 30,000 characters together.');return;}
    body.set('details',combinedDetails);
    const attached=body.getAll('drawings').filter(file=>file.size>0);
    if(attached.length>2||attached.some(file=>file.size>6*1024*1024)){setError('Attach up to two files, 6 MB each.');return;}
    requestId.current ||= [...crypto.getRandomValues(new Uint8Array(16))].map(value=>value.toString(16).padStart(2,'0')).join('');setPending(true);setError('');setStatus('Submitting your enquiry…');
    try{const response=await fetch('/api/enquiries',{method:'POST',headers:{'Idempotency-Key':requestId.current},body});const result=await response.json();if(!response.ok||!result.received)throw new Error(result.error||'Your enquiry could not be saved. Please try again.');setReceipt(result);setStatus('Enquiry received. Keep your reference number for follow-up.');}
    catch(e){setStatus('');setError(e instanceof Error?e.message:'Your enquiry could not be saved. Please call or email the team.');}
    finally{setPending(false);}
  }
  function prepare(){if(!form.current.reportValidity())return;const fields=Object.fromEntries(new FormData(form.current));fields.details=composeEnquiryDetails(fields.details,configurationDetails);setDraft(prepareEnquiry(fields));setStatus('Email draft prepared. Attach any drawings in your email app.');}
  async function copy(){try{await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);setStatus('Enquiry draft copied.');}catch{setStatus('Select the draft text or download it to keep a copy.');}}
  function download(){const url=URL.createObjectURL(new Blob([`${draft.subject}\n\n${draft.body}`],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Fastrack-project-enquiry.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <>
    <section id="enquiry" className="section enquiry-section">
      <div className="enquiry-intro reveal"><div className="chapter-label"><span>05 / Contact</span><i/></div><h2>Let’s shape<br/>your next project.</h2><p>Share your equipment list, drawing or available space. Include the material, finish and quantities you have in mind.</p><div className="contact-links"><a href={`mailto:${company.email}`}><Mail size={22}/>{company.email}</a><a href={`tel:${company.telephone}`}><Phone size={22}/>{company.telephoneLabel}</a><a className="contact-location" href={company.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Find Fastrack Metallic in Sharjah on Google Maps (opens in a new tab)"><MapPin size={22}/><span>{company.location}<small>Find us on Google Maps ↗</small></span></a></div><p className="contact-expectation">Have an urgent requirement? Call the team directly to discuss availability.</p></div>
      <form id="enquiry-form" ref={form} tabIndex={-1} className="enquiry-form" onSubmit={submit} onChange={changed}>
        <h3>Request a quotation</h3><p className="form-intro">Submit your requirements and receive an enquiry reference.</p>
        {requirement&&<div className="enquiry-selection" role="status"><span>Selected requirement</span><strong>{requirement}</strong>{configurationDetails&&<small>Your selected specification and your notes will be submitted together.</small>}</div>}
        <fieldset className="enquiry-fields" disabled={pending}>
          <div className="field-grid"><label>Name<input name="name" autoComplete="name" placeholder="Your full name" required minLength="2" maxLength="120"/></label><label>Email<input name="email" type="email" autoComplete="email" placeholder="Your email address" required maxLength="200"/></label><label>Phone <small>(optional)</small><input name="phone" type="tel" autoComplete="tel" placeholder="Your contact number" maxLength="40"/></label><label>Company <small>(optional)</small><input name="company" autoComplete="organization" placeholder="Your company name" maxLength="160"/></label><label className="requirement-field">Requirement<select aria-label="Requirement" name="requirement" value={requirement} onChange={e=>{setRequirement(e.target.value);onClearConfiguration?.();}} required><option value="">Select a requirement</option>{[...products.map(p=>p.name),'Laser cutting','CNC punching','Bending','Welding','Laser / punching / bending / welding','Multiple equipment / project list','Other project'].map(p=><option key={p}>{p}</option>)}</select></label></div>
          {configurationDetails&&<div className="enquiry-specification"><details open><summary>Selected specification</summary><pre>{configurationDetails}</pre></details><button type="button" className="text-control" onClick={onClearConfiguration}>Remove selected specification</button></div>}
          <label className="details-label">Project details<textarea name="details" value={details} onChange={e=>setDetails(e.target.value)} placeholder={configurationDetails?'Add installation, access, delivery or other project notes.':'Describe the equipment, measurements, material, finish and quantities you need.'} required={!configurationDetails} minLength={configurationDetails?undefined:15} maxLength={Math.max(0,30000-configurationDetails.length-50)} rows="5" aria-describedby="project-details-help"/></label><p id="project-details-help" className="project-details-help">{configurationDetails?'Additional notes are optional. Your selected specification is already included.':'Include the measurements, material, finish and quantities you need.'} Your notes stay here when you choose another product.</p>
          <div className="drawing-upload"><label htmlFor="enquiry-drawings"><Paperclip size={19}/>Drawings or reference images <small>(optional)</small></label><input id="enquiry-drawings" name="drawings" type="file" accept=".pdf,.dxf,.dwg,.png,.jpg,.jpeg" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).map(f=>f.name))} aria-describedby="drawing-help"/><p id="drawing-help">Up to 2 files, 6 MB each. PDF, DXF, DWG, PNG or JPG.</p>{files.length>0&&<ul>{files.map((name,i)=><li key={`${name}-${i}`}>{name}</li>)}</ul>}</div>
          <label className="enquiry-website-field" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off"/></label>
          <label className="consent"><input type="checkbox" name="consent" required/><span>I agree to be contacted about this enquiry. <a href="/privacy" target="_blank" rel="noopener noreferrer">Read the privacy notice ↗</a></span></label>
          <button className="button button-green prepare-button" type="submit" disabled={pending||Boolean(receipt)}>{pending?'Submitting…':receipt?'Enquiry received':'Submit enquiry'}{receipt?<CheckCircle2 size={22}/>:<ArrowRight size={22}/>}</button>
        </fieldset>
        {error&&<div className="form-error" role="alert"><strong>Enquiry not submitted</strong><p>{error}</p><span>Your details remain in this form.</span></div>}
        <p className="form-status" role="status">{status}</p>
        {receipt&&<div className="enquiry-receipt"><CheckCircle2 size={28}/><div><h4>Thank you. Your enquiry is received.</h4><p>Reference <strong>{receipt.reference}</strong></p><p>Your requirements are saved for team review. Quote this reference when you call or email.</p></div></div>}
        <details className="email-alternative"><summary>Prefer to send an email?</summary><p>Prepare a draft using the details above. Add drawings manually in your email app.</p><button className="button button-outline" type="button" onClick={prepare}>Prepare email draft</button>{draft&&<div className="draft-review"><h4>Review your email draft</h4><pre tabIndex="0">{draft.subject}{'\n\n'}{draft.body}</pre><div className="controls"><a className="button button-green" href={draft.mailto}>Open email app <ExternalLink size={16}/></a><button className="button button-outline" type="button" onClick={copy}><Copy size={16}/>Copy</button><button className="button button-outline" type="button" onClick={download}><Download size={16}/>Download</button></div></div>}</details>
      </form>
    </section>
    <footer className="site-footer"><div className="footer-statement" aria-label="Cut. Form. Join. Finish."><span>Cut.</span><span>Form.</span><span>Join.</span><span>Finish.</span></div><div className="footer-content"><div><Brand footer/><p>Fastrack — Engineered in Steel.</p></div><nav aria-label="Footer navigation"><a href="#studio">Manufacturing</a><a href="#products">Equipment</a><a href="#about">Company</a><a href="#enquiry">Contact</a><a href="/privacy">Privacy</a><a href="/admin/enquiries">Team access</a></nav><a className="back-to-top" href="#home">Back to top <ArrowUp size={18}/></a></div><div className="footer-utility"><small>© {new Date().getFullYear()} Fastrack Metallic. All rights reserved.</small><TechnicalToggle/><button className="intro-replay" type="button" onClick={onReplayIntro}>Replay opening ↗</button></div></footer>
  </>;
}
