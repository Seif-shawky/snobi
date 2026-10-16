import { useRef, useState, type FormEvent } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, Instagram, Mail, Send } from 'lucide-react';
import { Mascot, useLanguage } from '@/components/snobi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/contact')({
  head: () => ({ meta: [
    { title: 'Say Something. Snobi Is Listening. — Contact Snobi' },
    { name: 'description', content: 'Contact Snobi about clothing or an order. Official support details and message delivery are awaiting confirmation.' },
    { property: 'og:title', content: 'Say Something. Snobi Is Listening. — Contact Snobi' },
    { property: 'og:description', content: 'A small inbox for a broke dog. Contact details and message delivery are not available yet.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ContactPage,
});

type Field = 'name' | 'email' | 'order' | 'message';

function ContactPage() {
  const { ar } = useLanguage();
  const [values, setValues] = useState({ name: '', email: '', order: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notSent, setNotSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const labels = ar ? { name: 'الاسم', email: 'الإيميل', order: 'رقم الطلب', message: 'الرسالة' } : { name: 'Name', email: 'Email', order: 'Order number', message: 'Message' };
  function update(field: Field, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setNotSent(false);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (!values.name.trim()) next.name = ar ? 'اكتب اسمك.' : 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = ar ? 'اكتب إيميل صحيح.' : 'Please enter a valid email address.';
    if (!values.message.trim()) next.message = ar ? 'اكتب رسالتك.' : 'Please enter your message.';
    setErrors(next);
    setNotSent(false);
    const first = (['name', 'email', 'message'] as const).find(field => next[field]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#contact-${first}`)?.focus();
      return;
    }
    setNotSent(true);
  }
  return <>
    <section className="contact-intro page-width">
      <div className="story-topline"><span className="shop-breadcrumb"><Link to="/">{ar ? 'الرئيسية' : 'HOME'}</Link> / {ar ? 'تواصل معانا' : 'CONTACT'}</span><span className="phase-label">{ar ? 'المرحلة ٠' : 'PHASE 0'}</span></div>
      <div className="contact-title"><span className="section-kicker">{ar ? 'بني آدم هيرد. مش الكلب.' : 'A HUMAN WILL ANSWER. NOT THE DOG.'}</span><h1>{ar ? <>قول حاجة.<br />سنوبي سامعك.</> : <>SAY SOMETHING.<br />SNOBI IS LISTENING.</>}</h1><p className="handwriting">{ar ? 'لو عن فلوس، انتباهه هيزيد.' : 'especially if it’s about money.'}</p></div>
    </section>
    <section className="contact-layout page-width" aria-label={ar ? 'تواصل مع سنوبي' : 'Contact Snobi'}>
      <div className="contact-form-area">
        <div className="contact-section-heading"><h2>{ar ? 'سيب رسالة.' : 'LEAVE A MESSAGE.'}</h2><span>{ar ? 'الإرسال مش متاح لسه' : 'DELIVERY NOT AVAILABLE YET'}</span></div>
        <p className="contact-availability" id="contact-availability">{ar ? 'إرسال الرسائل لسه مش متاح. النموذج ده مش بيحفظ أو بيبعت رسالتك.' : 'Message delivery isn’t connected yet. This form does not save or send your message.'}</p>
        <form ref={formRef} noValidate onSubmit={submit} aria-describedby="contact-availability">
          <div className="contact-fields">{(['name', 'email', 'order'] as const).map(field => <div className={`contact-field ${field === 'order' ? 'contact-wide' : ''}`} key={field}>
            <label htmlFor={`contact-${field}`}>{labels[field]} {field === 'order' ? <span>{ar ? '(اختياري)' : '(optional)'}</span> : <span aria-hidden="true">*</span>}</label>
            <Input id={`contact-${field}`} name={field} type={field === 'email' ? 'email' : 'text'} autoComplete={field === 'name' ? 'name' : field === 'email' ? 'email' : 'off'} dir={field === 'email' || field === 'order' ? 'ltr' : undefined} required={field !== 'order'} maxLength={field === 'order' ? 80 : field === 'name' ? 100 : 254} value={values[field]} onChange={event => update(field, event.target.value)} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `contact-${field}-error` : undefined} />
            {errors[field] && <p className="contact-error" id={`contact-${field}-error`}>{errors[field]}</p>}
          </div>)}
          <div className="contact-field contact-wide"><label htmlFor="contact-message">{labels.message} <span aria-hidden="true">*</span></label><Textarea id="contact-message" name="message" required maxLength={4000} value={values.message} onChange={event => update('message', event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'contact-message-error' : 'contact-message-note'} /><p id="contact-message-note" className="contact-field-note">{ar ? 'متكتبش بيانات دفع أو كلمات سر.' : 'Please don’t include payment details or passwords.'}</p>{errors.message && <p className="contact-error" id="contact-message-error">{errors.message}</p>}</div></div>
          {notSent && <div className="contact-feedback" role="alert"><strong>{ar ? 'رسالتك ما اتبعتتش.' : 'YOUR MESSAGE WAS NOT SENT.'}</strong><p>{ar ? 'إرسال الرسائل لسه مش متاح. كلامك لسه في النموذج، ومش محفوظ عندنا. بيانات الدعم الحقيقية هتتضاف لما تتأكد.' : 'Message delivery is not available yet. Your text is still in the form and has not been saved by us. Actual support details will be added once confirmed.'}</p></div>}
          <Button variant="ink" type="submit">{ar ? 'إرسال الرسالة' : 'SEND MESSAGE'}<Send aria-hidden="true" /></Button>
        </form>
      </div>
      <aside className="contact-aside">
        <div className="contact-channels"><h2>{ar ? 'أو من هنا.' : 'OR, OVER HERE.'}</h2><div><Mail aria-hidden="true" /><div><h3>{ar ? 'إيميل الدعم' : 'SUPPORT EMAIL'}</h3><p>{ar ? 'الإيميل الرسمي لسه مش مؤكد.' : 'Official email not confirmed yet.'}</p></div></div><div><Instagram aria-hidden="true" /><div><h3>INSTAGRAM</h3><p>{ar ? 'الحساب الرسمي لسه مش مؤكد.' : 'Official account not confirmed yet.'}</p></div></div></div>
        <div className="contact-dog"><Mascot className="contact-mascot" /><p className="handwriting">{ar ? 'سنوبي مش شاطر في الرد على الإيميلات. بنشتغل على الموضوع.' : "snobi is bad at answering emails. we're working on it."}</p></div>
        <Button variant="note" asChild><Link to="/faq">{ar ? 'يمكن الإجابة هنا' : 'MAYBE IT’S IN THE FAQ'}<ArrowUpRight /></Link></Button>
      </aside>
    </section>
  </>;
}