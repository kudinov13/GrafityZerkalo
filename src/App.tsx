import { lazy, Suspense, type SyntheticEvent, useEffect, useRef, useState } from 'react'
import './App.css'
import ChatWidget from './chat/ChatWidget'
import Lightbox from './Lightbox'
import { api } from './api'

const AdminPanel = lazy(() => import('./admin/AdminPanel'))

const ASSET_VERSION = '20260923a'
const assetUrl = (src: string) => src.startsWith('/images/') ? `${src}?v=${ASSET_VERSION}` : src

function retryImage(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (image.dataset.retry) return
  image.dataset.retry = '1'
  image.src = `${image.src}${image.src.includes('?') ? '&' : '?'}retry=1`
}
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
  ['Можно перенести на зеркало мой эскиз?', 'Да. Виталий посмотрит рисунок, тег, фотографию или готовый макет и подготовит его к зеркальной форме.'],
  ['А если я пока не знаю, что хочу?', 'Это нормально. Расскажите Виталию, где будет зеркало и что вам нравится. Он больше 18 лет занимается граффити и поможет найти направление.'],
  ['Какие размеры доступны?', 'Стандартная ширина — 40, 60 или 90 см. Высота зависит от формы эскиза. Индивидуальный размер можно обсудить с Виталием.'],
  ['Сколько проходит от эскиза до зеркала?', 'После утверждения эскиза и полной оплаты нужно 7–10 рабочих дней.'],
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

function shouldUseLiteMode(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return Boolean(
    connection?.saveData
    || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType || '')
    || (deviceMemory !== undefined && deviceMemory <= 2)
    || (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2),
  )
}

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
                <img src={assetUrl(work.image)} alt={`Граффити-зеркало ${work.name}`} loading={index < 2 ? 'eager' : 'lazy'} onError={retryImage} onClick={() => setLightbox(assetUrl(work.image))} />
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
  const [liteMode] = useState(shouldUseLiteMode)
  const [visibleReviewCount, setVisibleReviewCount] = useState(() => liteMode ? 4 : 6)
  const reviewTrackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add('app-ready')
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
    try {
      track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
    } catch {
      track.scrollLeft += dir * track.clientWidth * 0.8
    }
  }

  const loadMoreReviews = () => {
    const track = reviewTrackRef.current
    if (!track || track.scrollLeft + track.clientWidth < track.scrollWidth - 160) return
    setVisibleReviewCount((count) => Math.min(reviews.length, count + (liteMode ? 4 : 6)))
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
    if (liteMode || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.14 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [archiveOpen, adminOpen, liteMode])

  if (archiveOpen) return <PortfolioArchive works={works} onBack={() => setArchiveOpen(false)} />
  if (adminOpen) return <Suspense fallback={<div className="admin-overlay">Загрузка…</div>}><AdminPanel onExit={() => { window.location.href = window.location.pathname }} /></Suspense>

  const currentWork = works.length ? works[Math.min(activeWork, works.length - 1)] : { name: '', size: '', image: '' }
  const moveWork = (step: number) => setActiveWork((current) => Math.min(works.length - 1, Math.max(0, current + step)))

  return (
    <main className={liteMode ? 'site--lite' : undefined}>
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
        <a className="header-cta" href="#contact">Обсудить идею <ArrowIcon /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero__media" aria-hidden="true">
          <picture>
            <source media="(max-width: 680px)" srcSet="/images/Mobile/Hero-mobile-hq.webp" />
            <img src="/images/Hero_Desktop-hq.webp" alt="" fetchPriority="high" onError={retryImage} />
          </picture>
        </div>
        <div className="hero__shade" />
        <div className="hero__meta">
          <span>Москва</span>
          <span>Авторский почерк</span>
          <span>One of one</span>
        </div>
        <div className="hero__content">
          <h1>Граффити<br />в отражении.<br />Почерк с улиц,<br />вне стен.</h1>
          <p>Я Виталий RAMCY. Переношу граффити на зеркало. Начнём с тега, персонажа или настроения?</p>
        </div>
        <a className="hero__cta" href="#contact">
          <span>Начать с идеи</span>
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
          <p className="section-intro">Тег, имя, персонаж или надпись — у каждой работы свой почерк. Если пока есть только настроение, Виталий поможет превратить его в эскиз.</p>
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
                        loading={index === activeWork ? 'eager' : 'lazy'}
                        decoding="async"
                        onError={retryImage}
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
            <p>Каждый эскиз Виталий разрабатывает под конкретную идею.</p>
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

      <section className="manifesto" data-reveal>
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
            <img src={assetUrl('/images/ramcy.webp')} alt="Виталий RAMCY за работой" loading="lazy" onError={retryImage} />
          </picture>
          <span>RAMCY / MOSCOW</span>
        </div>
        <div className="artist__text" data-reveal>
          <p className="eyebrow">03 / Автор</p>
          <h2>18 лет<br />в граффити. <em>RAMCY.</em></h2>
          <p>Я Виталий Гуров. На улицах меня знают как RAMCY. Рисую граффити больше 18 лет. Зеркала стали для меня способом вынести уличный почерк за пределы стены и впустить его в повседневную жизнь.</p>
          <p>Каждая работа начинается с эскиза. Можно принести свой тег, фото или готовый макет. Если пока нет точного образа, обсудим его вместе. Работаю в Москве, а готовые зеркала отправляю по всей России.</p>
          <div className="artist__facts">
            <span><strong>1/1</strong>Каждый эскиз создаётся отдельно</span>
            <span><strong>Москва</strong>Здесь начинается каждая работа</span>
          </div>
        </div>
      </section>

      <section className="process section">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">04 / Процесс</p>
          <h2>От первой линии<br />до <em>отражения.</em></h2>
        </div>
        <div className="process-list">
          {[
            ['01', 'Направление', 'Находим, что вам близко: буквы, персонаж, цвет или настроение.'],
            ['02', 'Эскиз', 'Виталий переводит идею в форму и показывает макет до начала работы.'],
            ['03', 'Цвет и размер', 'Подбираем цвет контура и формат под место, где будет зеркало.'],
            ['04', 'Готовая работа', 'Зеркало создаётся в мастерской RAMCY. Доставку Виталий согласует с вами лично.'],
          ].map(([number, title, text]) => (
            <article key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="campaign" aria-label="Граффити-зеркала в интерьере">
        <picture>
          <source media="(max-width: 680px)" srcSet={assetUrl('/images/Mobile/Mobile-2-v2.webp')} />
          <img src={assetUrl('/images/3.webp')} alt="Девушка держит граффити-зеркало на фоне серой бетонной стены" loading="lazy" onError={retryImage} />
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
          <h2>Их зеркала.<br /><em>Их слова.</em></h2>
          <p className="section-intro">Сообщения и сторис от людей, у которых уже живут зеркала RAMCY.</p>
        </div>
        <div className="reviews-feed" data-reveal>
          <div className="reviews-feed__controls">
            <span className="reviews-feed__label">Из личных сообщений</span>
            <div className="reviews-feed__buttons">
              <button type="button" className="reviews-feed__nav reviews-feed__nav--prev" aria-label="Назад" onClick={() => scrollReviews(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" className="reviews-feed__nav reviews-feed__nav--next" aria-label="Вперёд" onClick={() => scrollReviews(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>
          <div className="reviews-feed__track" ref={reviewTrackRef} onScroll={loadMoreReviews}>
            {reviews.slice(0, visibleReviewCount).map((image, i) => (
              <figure className="reviews-feed__item" key={i}>
                <picture>
                  <source media="(max-width: 680px)" srcSet={mobileReviewUrl(image)} />
                  <img src={assetUrl(image)} alt={`Сообщение о работе RAMCY №${i + 1}`} loading="lazy" onError={retryImage} onClick={() => setLightbox(assetUrl(image))} />
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
          <p className="section-intro">О размерах, эскизах и пути от первой идеи до готового зеркала.</p>
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

      <section className="contact" id="contact" data-reveal>
        <div className="contact__lead" data-reveal>
          <p className="eyebrow">08 / Твоя очередь</p>
          <h2>Какое зеркало<br />увидишь <em>ты?</em></h2>
          <p>Есть конкретный эскиз? Расскажите, что хотите увидеть: свой тег, персонажа, фразу или цвет. Если пока есть только настроение, Виталий поможет его собрать. Размер и доставку он обсудит с вами лично.</p>
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
          <label>Что хочется увидеть?<textarea name="idea" rows={4} placeholder="Тег, персонаж, фраза или просто настроение" /></label>
          <button type="submit" disabled={formState === 'sending'}>
            {formState === 'sending' ? 'Отправляем…' : 'Передать идею Виталию'} <ArrowIcon />
          </button>
          {formState === 'sent' && <p className="contact__status">Заявка отправлена. Скоро Виталий с вами свяжется. Спасибо!</p>}
          {formState === 'error' && <p className="contact__status contact__status--error">Не удалось отправить. Напишите напрямую: t.me/ramcy_graffiti</p>}
          <p>Нажимая кнопку, вы соглашаетесь с <a href="/privacy.html" target="_blank" rel="noreferrer">политикой обработки персональных данных</a>.</p>
        </form>
      </section>

      <footer>
        <a className="brand" href="#top"><img src={assetUrl('/images/GrafitLogo-small.webp')} alt="VITALIY RAMCY" /></a>
        <p><span onClick={() => { window.location.hash = 'admin'; setAdminOpen(true) }}>Граффити-зеркала RAMCY</span> · Москва · Доставка по России</p>
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
