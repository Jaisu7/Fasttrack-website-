export function prepareEnquiry(fields) {
  const clean = (key) => String(fields[key] || "").trim();
  const name = clean("name"),
    email = clean("email"),
    company = clean("company"),
    requirement = clean("requirement"),
    details = clean("details");
  const subject = `Project enquiry — ${requirement || "Stainless steel fabrication"}`;
  const body = `Hello Fastrack Metallic,\n\nI would like to discuss the following project.\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || "Not provided"}\nRequirement: ${requirement}\n\nProject details:\n${details}\n\nI agree to be contacted about this enquiry.\n\nKind regards,\n${name}`;
  return {
    subject,
    body,
    mailto: `mailto:info@fasttrackmi.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}
