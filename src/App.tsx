import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import './App.css'
import ChatWidget from './chat/ChatWidget'
import Lightbox from './Lightbox'
import { api } from './api'

const AdminPanel = lazy(() => import('./admin/AdminPanel'))

const ASSET_VERSION = '20260921e'
const assetUrl = (src: string) => src.startsWith('/images/') ? `${src}?v=${ASSET_VERSION}` : src
const mobileWorkUrl = (src: string) => src.startsWith('/images/IMG_') && src.endsWith('.webp')
  ? assetUrl(src.replace('.webp', '-mobile.webp'))
  : assetUrl(src)
const mobileReviewUrl = (src: string) => src.startsWith('/images/IMG_') && src.endsWith('.jpeg')
  ? assetUrl(src.replace('.jpeg', '-mobile.jpg'))
  : assetUrl(src)

const fallbackWorks = [
  { name: 'Mash', size: '90 см', image: '/images/IMG_9801.webp' },
  { name: 'Ustyles', size: '60 см', image: '/images/IMG_7579.webp' },
  { name: 'Arton', size: '60 см', image: '/images/IMG_8730.webp' },
  { name: 'Traffic', size: '95 см', image: '/images/IMG_9767.webp' },
  { name: 'Ramcy', size: '60 см', image: '/images/IMG_6804.webp' },
  { name: 'DJ ПЛАЩ', size: '60 см', image: '/images/IMG_9422.webp' },
  { name: 'Break dance', size: '60 см', image: '/images/IMG_9590.webp' },
  { name: 'Graffitimarket', size: '60 см', image: '/images/IMG_0001.webp' },
  { name: 'MAGU', size: '60 см', image: '/images/IMG_0002.webp' },
  { name: 'Около', size: '60 см', image: '/images/IMG_0003.webp' },
  { name: 'Mosya', size: '60 см', image: '/images/IMG_9999.webp' },
  { name: 'Tipadima', size: '60 см', image: '/images/IMG_9976.webp' },
]

const prices = [
  { size: '40', price: '5 500 ₽', note: 'Компактный акцент' },
  { size: '60', price: '7 500 ₽', note: 'Самый ходовой', popular: true },
  { size: '90', price: '13 500 ₽', note: 'Главный объект комнаты' },
]

const fallbackReviews = [
  '/images/IMG_9990.jpeg',
  '/images/IMG_9982.jpeg',
  '/images/IMG_9980.jpeg',
  '/images/IMG_9981.jpeg',
  '/images/IMG_9983.jpeg',
  '/images/IMG_9984.jpeg',
  '/images/IMG_9985.jpeg',
  '/images/IMG_9988.jpeg',
  '/images/IMG_9987.jpeg',
  '/images/IMG_9992.jpeg',
  '/images/IMG_9991.jpeg',
  '/images/IMG_9993.jpeg',
  '/images/IMG_9994.jpeg',
  '/images/IMG_9995.jpeg',
  '/images/IMG_9996.jpeg',
  '/images/IMG_9997.jpeg',
  '/images/IMG_9973.jpeg',
  '/images/IMG_9968.jpeg',
]

const questions = [
  ['Можно сделать граффити-зеркало по моему эскизу?', 'Да. Можно прислать готовый рисунок, фотографию, логотип или идею. Если эскиза нет, Виталий разработает его с нуля.'],
  ['Какие размеры арт-зеркал доступны?', 'Стандартная ширина — 40, 60 или 90 см. Высота зависит от формы эскиза. Индивидуальный размер можно обсудить с Виталием.'],
  ['Сколько занимает изготовление?', 'Изготовление занимает 7–10 рабочих дней после утверждения эскиза и полной оплаты.'],
  ['Можно выбрать цвета?', 'Да. Цвет основы и контуров согласуем до начала работы, чтобы зеркало точно попало в интерьер или фирменный стиль.'],
  ['Доставляете ли вы зеркала по России?', 'Да. Производство находится в Москве. Доставка доступна по Москве, Московской области и всей России; способ и стоимость согласовываются лично с Виталием.'],
]

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  )
}

type Work = { name: string; size: string; image: string }

const ARCHIVE_PAGE_SIZE = 8

function PortfolioArchive({ works, onBack }: { works: Work[]; onBack: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(ARCHIVE_PAGE_SIZE)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const goBack = () => { setMenuOpen(false); onBack() }
  const visibleWorks = works.slice(0, visibleCount)
  const hasMore = visibleCount < works.length

  return (
    <main className="archive-page">
      <header className="archive-header">
        <a className="brand" href="#top" onClick={goBack} aria-label="Vitaliy Ramcy, на главную"><img src={assetUrl('/images/GrafitLogo-small.webp')} alt="VITALIY RAMCY" /></a>
        <nav id="archive-navigation" className={menuOpen ? 'nav nav--open' : 'nav'} aria-label="Основная навигация">
          <a href="#works" onClick={goBack}>Работы</a>
          <a href="#artist" onClick={goBack}>Автор</a>
          <a href="#prices" onClick={goBack}>Размеры</a>
          <a href="#faq" onClick={goBack}>FAQ</a>
        </nav>
        <button type="button" className="archive-back" onClick={onBack}>← Назад</button>
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="archive-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
          <span className="sr-only">Открыть меню</span>
        </button>
      </header>
      <section className="archive-hero">
        <p className="eyebrow">Портфолио / Все работы</p>
        <h1>Твоё отражение<br /><em>в уличной эст<span className="kern-e">е</span>тике</em></h1>
        <p>Архив авторских граффити-зеркал RAMCY. Каждый объект начинается с линии и заканчивается частью чьего-то пространства.</p>
      </section>
      <section className="archive-grid" aria-label="Все работы">
        {visibleWorks.map((work, index) => (
          <article className="archive-card" key={`${work.name}-${index}`}>
            <div className="archive-card__image">
              <picture>
                <source media="(max-width: 680px)" srcSet={mobileWorkUrl(work.image)} />
                <img src={assetUrl(work.image)} alt={`Граффити-зеркало ${work.name}`} loading={index < 2 ? 'eager' : 'lazy'} onClick={() => setLightbox(assetUrl(work.image))} />
              </picture>
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="archive-card__caption"><h2>{work.name}</h2><span>{work.size}</span></div>
          </article>
        ))}
      </section>
      <div className="archive-actions">
        {hasMore && (
          <button type="button" className="archive-more" onClick={() => setVisibleCount((count) => count + ARCHIVE_PAGE_SIZE)}>
            Показать ещё <span>{works.length - visibleCount}</span>
          </button>
        )}
        <a className="archive-contact" href="#contact" onClick={onBack}>Обсудить своё зеркало <ArrowIcon /></a>
      </div>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </main>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeWork, setActiveWork] = useState(0)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [works, setWorks] = useState<Work[]>(fallbackWorks)
  const [reviews, setReviews] = useState<string[]>(fallbackReviews)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const reviewTrackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.location.hash === '#admin') {
      setAdminOpen(true)
    }
  }, [])

  useEffect(() => {
    api.getProducts()
      .then((products) => {
        setWorks(products.map((p) => ({
          name: String(p.name),
          size: String(p.size),
          image: p.cover ? (String(p.cover).startsWith('/') ? String(p.cover) : `/uploads/${p.cover}`) : '/images/IMG_9801.webp',
        })))
      })
      .catch(() => {})

    api.getReviews()
      .then((items) => {
        setReviews(items.map((r) => (r.filename.startsWith('/') ? r.filename : `/uploads/${r.filename}`)))
      })
      .catch(() => {})
  }, [])

  const scrollReviews = (dir: number) => {
    const track = reviewTrackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  const submitContactForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (formState === 'sending') return
    const form = event.currentTarget
    const data = new FormData(form)
    setFormState('sending')
    try {
      await api.submitApplication({
        name: String(data.get('name') || ''),
        phone: String(data.get('phone') || ''),
        email: String(data.get('email') || ''),
        contact_method: String(data.get('contact_method') || ''),
        messenger_contact: String(data.get('messenger_contact') || ''),
        design_idea: String(data.get('idea') || ''),
      })
      setFormState('sent')
      form.reset()
    } catch {
      setFormState('error')
    }
  }

  useEffect(() => {
    if (archiveOpen || adminOpen) return
    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.14 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [archiveOpen, adminOpen])

  if (archiveOpen) return <PortfolioArchive works={works} onBack={() => setArchiveOpen(false)} />
  if (adminOpen) return <Suspense fallback={<div className="admin-overlay">Загрузка…</div>}><AdminPanel onExit={() => { window.location.href = window.location.pathname }} /></Suspense>

  const currentWork = works.length ? works[Math.min(activeWork, works.length - 1)] : { name: '', size: '', image: '' }
  const moveWork = (step: number) => setActiveWork((current) => Math.min(works.length - 1, Math.max(0, current + step)))

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Vitaliy Ramcy, на главную">
          <img src={assetUrl('/images/GrafitLogo-small.webp')} alt="VITALIY RAMCY" />
        </a>
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
          <span className="sr-only">Открыть меню</span>
        </button>
        <nav id="main-navigation" className={menuOpen ? 'nav nav--open' : 'nav'} aria-label="Основная навигация">
          <a href="#works" onClick={() => setMenuOpen(false)}>Работы</a>
          <a href="#artist" onClick={() => setMenuOpen(false)}>Автор</a>
          <a href="#prices" onClick={() => setMenuOpen(false)}>Размеры</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
        </nav>
        <a className="header-cta" href="#contact">Заказать <ArrowIcon /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero__media" aria-hidden="true">
          <picture>
            <source media="(max-width: 680px)" srcSet={assetUrl('/images/Mobile/Hero-mobile-v2.webp')} />
            <img src={assetUrl('/images/Hero_Desktop.webp')} alt="" fetchPriority="high" />
          </picture>
        </div>
        <div className="hero__shade" />
        <div className="hero__meta">
          <span>Москва</span>
          <span>Арт-объекты</span>
          <span>One of one</span>
        </div>
        <div className="hero__content">
          <h1>Арт-зеркала и<br />граффити-зеркала на заказ</h1>
          <p>Создаём в Москве по вашему эскизу или с дизайном с нуля. Доставляем по Московской области и всей России.</p>
        </div>
        <a className="hero__cta" href="#contact">
          <span>Создать своё</span>
          <ArrowIcon />
        </a>
      </section>

      <div className="ticker" aria-label="Граффити-зеркала, сделано в Москве">
        <div>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
          <span>Граффити-зеркала</span><i>✦</i><span>Сделано в Москве</span><i>✦</i><span>Твой эскиз</span><i>✦</i><span>One of one</span><i>✦</i>
        </div>
      </div>

      <section className="works section" id="works">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">01 / Портфолио</p>
          <h2>Не вписываются.<br /><em>Меняют пространство.</em></h2>
          <p className="section-intro">Каждое арт-зеркало — уникальный объект с индивидуальным граффити-дизайном. Можно заказать зеркало по своему эскизу или доверить разработку Виталию.</p>
        </div>
        <div className="works-carousel" data-reveal>
          <div className="works-carousel__image">
            <div className="works-carousel__track" style={{ transform: `translate3d(-${activeWork * 100}%, 0, 0)` }}>
              {works.map((work, index) => (
                <div className="works-carousel__slide" key={`${work.name}-${index}`}>
                  {Math.abs(index - activeWork) <= 1 && (
                    <picture>
                      <source media="(max-width: 680px)" srcSet={mobileWorkUrl(work.image)} />
                      <img
                        src={assetUrl(work.image)}
                        alt={`Граффити-зеркало ${work.name}`}
                        loading="eager"
                        onClick={() => setLightbox(assetUrl(work.image))}
                      />
                    </picture>
                  )}
                </div>
              ))}
            </div>
            <span>{String(activeWork + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}</span>
          </div>
          <div className="works-carousel__info">
            <p className="eyebrow">Избранная работа</p>
            <h3>{currentWork.name}</h3>
            <p>Уникальный арт-объект с индивидуальным рисунком.</p>
            <strong>{currentWork.size}</strong>
            <div className="works-carousel__controls">
              <button type="button" aria-label="Предыдущая работа" disabled={activeWork === 0} onClick={() => moveWork(-1)}>←</button>
              <button type="button" aria-label="Следующая работа" disabled={activeWork === works.length - 1} onClick={() => moveWork(1)}>→</button>
            </div>
          </div>
        </div>
        <div className="works-footer">
          <button className="archive-button" type="button" onClick={() => setArchiveOpen(true)}>Все работы <ArrowIcon /></button>
          <a className="text-link" href="#contact">Хочу зеркало со своим именем <ArrowIcon /></a>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto__line" data-reveal>
          <span>ЗЕРКАЛО</span>
          <span className="manifesto__script">с характером</span>
        </div>
        <div className="manifesto__copy" data-reveal>
          <p>Граффити с улиц прямиком в интерьер.</p>
          <span>02 / Идея</span>
        </div>
      </section>

      <section className="artist section" id="artist">
        <div className="artist__photo" data-reveal>
          <picture>
            <source media="(max-width: 680px)" srcSet={assetUrl('/images/ramcy-mobile.webp')} />
            <img src={assetUrl('/images/ramcy.webp')} alt="Виталий RAMCY за работой" loading="lazy" />
          </picture>
          <span>RAMCY / MOSCOW</span>
        </div>
        <div className="artist__text" data-reveal>
          <p className="eyebrow">03 / Автор</p>
          <h2>Идея, рождённая<br />из любви к <em>уличному искусству.</em></h2>
          <p>Меня зовут Виталий Гуров, в граффити известен как RAMCY — уличный художник и блогер из Москвы. Я придумал граффити-зеркала — кастомные арт-объекты, которые объединяют функциональность зеркала и выразительность уличного искусства.</p>
          <p>Первые продажи проходили через мой блог: люди увидели работы, влюбились в идею и заказывали зеркала для дома, студий и в подарок. Производим арт-зеркала в Москве и доставляем по Московской области и всей России. Каждый объект создаётся в единственном экземпляре: вы выбираете размер, цвета контуров и эскиз будущего зеркала.</p>
          <div className="artist__facts">
            <span><strong>1/1</strong>Каждый дизайн уникален</span>
            <span><strong>Москва</strong>Здесь создаем проекты</span>
          </div>
        </div>
      </section>

      <section className="process section">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">04 / Процесс</p>
          <h2>От пары слов<br />до <em>готового арт-объекта.</em></h2>
        </div>
        <div className="process-list">
          {[
            ['01', 'Знакомство', 'Позволит подчеркнуть индивидуальность.'],
            ['02', 'Эскиз', 'Работаем с твоей идеей или придумаем дизайн с нуля.'],
            ['03', 'Цвет и форма', 'Учтём пожелания по размерам и цветам контуров.'],
            ['04', 'Готово', 'Надёжно упаковываем зеркало, положим фирменный бонус и согласуем доставку.'],
          ].map(([number, title, text]) => (
            <article key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <i>↗</i>
            </article>
          ))}
        </div>
      </section>

      <section className="campaign" aria-label="Граффити-зеркала в интерьере">
        <picture>
          <source media="(max-width: 680px)" srcSet={assetUrl('/images/Mobile/Mobile-2-v2.webp')} />
          <img src={assetUrl('/images/3.webp')} alt="Девушка держит граффити-зеркало на фоне серой бетонной стены" loading="lazy" />
        </picture>
        <div className="campaign__overlay" />
        <div className="campaign__content" data-reveal>
          <p className="eyebrow">У граффити много форм,</p>
          <h2>Зеркало — одна<br />из них.</h2>
          <a href="#contact">Создать свою форму <ArrowIcon /></a>
        </div>
        <span className="campaign__note">Collection study / 2026</span>
      </section>

      <section className="prices section" id="prices">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">05 / Размеры</p>
          <h2>Выбери<br /><em>свой масштаб.</em></h2>
          <p className="section-intro">Три самых популярных формата. Учитывается ширина зеркала — по горизонтали. Высота пропорционально дизайну.</p>
        </div>
        <div className="price-grid">
          {prices.map((item) => (
            <article className={item.popular ? 'price price--popular' : 'price'} key={item.size} data-reveal>
              {item.popular && <span className="price__tag">Чаще выбирают</span>}
              <div className="price__size"><strong>{item.size}</strong><span>см</span></div>
              <p>{item.note}</p>
              <ul>
                <li>Ваш или наш эскиз</li>
                <li>Дизайнерская работа</li>
                <li>Выбор цветов</li>
                <li>+Доставка по согласованию</li>
              </ul>
              <div className="price__footer">
                <strong>{item.price}</strong>
              </div>
            </article>
          ))}
        </div>
        <p className="price-note">Производство в Москве. Доставка по Москве, Московской области и всей России рассчитывается отдельно и согласовывается лично.</p>
      </section>

      <section className="reviews section">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">06 / Отзывы</p>
          <h2>Что говорят<br /><em>клиенты.</em></h2>
          <p className="section-intro">Реальные отзывы из соцсетей — скрины историй с комментариями от людей, которые уже заказали граффити-зеркала.</p>
        </div>
        <div className="reviews-feed" data-reveal>
          <div className="reviews-feed__controls">
            <span className="reviews-feed__label">Реальные отзывы клиентов</span>
            <div className="reviews-feed__buttons">
              <button type="button" className="reviews-feed__nav reviews-feed__nav--prev" aria-label="Назад" onClick={() => scrollReviews(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" className="reviews-feed__nav reviews-feed__nav--next" aria-label="Вперёд" onClick={() => scrollReviews(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>
          <div className="reviews-feed__track" ref={reviewTrackRef}>
            {reviews.map((image, i) => (
              <figure className="reviews-feed__item" key={i}>
                <picture>
                  <source media="(max-width: 680px)" srcSet={mobileReviewUrl(image)} />
                  <img src={assetUrl(image)} alt={`Отзыв клиента о граффити-зеркале RAMCY №${i + 1}`} loading="lazy" onClick={() => setLightbox(assetUrl(image))} />
                </picture>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="faq section" id="faq">
        <div className="faq__heading" data-reveal>
          <p className="eyebrow">07 / Вопросы</p>
          <h2>Коротко<br /><em>о важном.</em></h2>
          <p className="section-intro">Ответы на самые популярные вопросы о заказе, изготовлении и доставке.</p>
        </div>
        <div className="faq__list">
          {questions.map(([question, answer], index) => (
            <details key={question} data-reveal>
              <summary><span>{String(index + 1).padStart(2, '0')}</span>{question}<i>+</i></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="contact__lead" data-reveal>
          <p className="eyebrow">08 / Твоя очередь</p>
          <h2>Какое зеркало<br />увидишь <em>ты?</em></h2>
          <p>Расскажите, какой размер арт-зеркала вам нужен и есть ли готовый эскиз. Виталий свяжется с вами, обсудит дизайн и доставку по Москве, Московской области или в другой регион России.</p>
          <a href="https://t.me/ramcy_graffiti" target="_blank" rel="noreferrer">@ramcy_graffiti <ArrowIcon /></a>
        </div>
        <form className="contact__form" data-reveal onSubmit={submitContactForm}>
          <label>Как вас зовут?<input type="text" name="name" autoComplete="name" placeholder="Имя" required /></label>
          <label>Номер телефона<input type="tel" name="phone" autoComplete="tel" placeholder="+7 999 000-00-00" required /></label>
          <label>Email (необязательно)<input type="email" name="email" autoComplete="email" placeholder="name@example.com" /></label>
          <label>Где с вами связаться?
            <select name="contact_method" required defaultValue="">
              <option value="" disabled>Выберите мессенджер</option>
              <option value="telegram">Telegram</option>
              <option value="vk">VK</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <label>Контакт в мессенджере<input type="text" name="messenger_contact" placeholder="Telegram @username / ссылка VK / номер WhatsApp" required /></label>
          <label>Пожелания по размеру и дизайну<textarea name="idea" rows={4} placeholder="Какой размер зеркала хотите? Дизайн есть или придумать?" /></label>
          <button type="submit" disabled={formState === 'sending'}>
            {formState === 'sending' ? 'Отправляем…' : 'Отправить заявку'} <ArrowIcon />
          </button>
          {formState === 'sent' && <p className="contact__status">Заявка отправлена. Скоро Виталий с вами свяжется. Спасибо!</p>}
          {formState === 'error' && <p className="contact__status contact__status--error">Не удалось отправить. Напишите напрямую: t.me/ramcy_graffiti</p>}
          <p>Нажимая кнопку, вы соглашаетесь с <a href="/privacy.html" target="_blank" rel="noreferrer">политикой обработки персональных данных</a>.</p>
        </form>
      </section>

      <footer>
        <a className="brand" href="#top"><img src={assetUrl('/images/GrafitLogo-small.webp')} alt="VITALIY RAMCY" /></a>
        <p><span onClick={() => { window.location.hash = 'admin'; setAdminOpen(true) }}>Арт- и граффити</span>-зеркала · Москва · Доставка по России</p>
        <div>
          <a href="tel:+79778665350">+7 977 866-53-50</a>
          <a href="mailto:ya@vitaligurov.ru">ya@vitaligurov.ru</a>
          <a href="https://t.me/ramcy_graffiti" target="_blank" rel="noreferrer">Telegram</a>
          <a href="/privacy.html">Конфиденциальность</a>
        </div>
        <small>© 2026 Vitaliy Ramcy</small>
      </footer>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <ChatWidget />
    </main>
  )
}

export default App
