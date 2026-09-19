import { useEffect, useRef, useState } from 'react'
import './App.css'
import AdminPanel from './admin/AdminPanel'
import Lightbox from './Lightbox'
import './admin/AdminPanel.css'
import { api } from './api'

const fallbackWorks = [
  { name: 'Mash', size: '90 см', image: '/images/IMG_9801.webp' },
  { name: 'Tipadima', size: '60 см', image: '/images/IMG_7579.webp' },
  { name: 'DJ ПЛАЩ', size: '60 см', image: '/images/IMG_8730.webp' },
  { name: 'Magu', size: '60 см', image: '/images/IMG_9767.webp' },
  { name: 'Traffic', size: '95 см', image: '/images/IMG_6804.webp' },
  { name: 'Graffitimarket', size: '90 см', image: '/images/IMG_9422.webp' },
  { name: 'Около', size: '60 см', image: '/images/IMG_9590.webp' },
  { name: 'Ustyles', size: '60 см', image: '/images/IMG_0001.webp' },
  { name: 'Arton', size: '60 см', image: '/images/IMG_0002.webp' },
  { name: 'Break dance', size: '60 см', image: '/images/IMG_0003.webp' },
  { name: 'Traffic', size: '95 см', image: '/images/IMG_9999.webp' },
  { name: 'Custom / 01', size: '60 см', image: '/images/IMG_9976.webp' },
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
  ['Можно сделать зеркало по моему эскизу?', 'Да. Можно прийти с готовым рисунком, фотографией или простой идеей. Если эскиза нет, Виталий разработает его с нуля.'],
  ['Как выбрать размер?', 'Размер считается по ширине зеркала. Высота зависит от формы эскиза. Для небольшого акцента подойдёт 40 см, для комнаты чаще выбирают 60 см, а 90 см работает как самостоятельный арт-объект.'],
  ['Сколько занимает изготовление?', 'Срок зависит от сложности рисунка и текущей очереди. Точную дату Виталий назовёт после обсуждения эскиза.'],
  ['Можно выбрать цвета?', 'Да. Цвет основы и контуров согласуем до начала работы, чтобы зеркало точно попало в интерьер или фирменный стиль.'],
  ['Как проходит доставка?', 'Зеркала производятся в Москве. Доставка рассчитывается отдельно с учётом города, размера и безопасной упаковки.'],
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
        <a className="brand" href="#top" onClick={goBack} aria-label="Vitaliy Ramcy, на главную"><img src="/images/GrafitLogo.png" alt="VITALIY RAMCY" /></a>
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
              <img src={work.image} alt={`Граффити-зеркало ${work.name}`} onClick={() => setLightbox(work.image)} />
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
  if (adminOpen) return <AdminPanel onExit={() => { window.location.href = window.location.pathname }} />

  const currentWork = works.length ? works[Math.min(activeWork, works.length - 1)] : { name: '', size: '', image: '' }
  const moveWork = (step: number) => setActiveWork((current) => Math.min(works.length - 1, Math.max(0, current + step)))

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Vitaliy Ramcy, на главную">
          <img src="/images/GrafitLogo.png" alt="VITALIY RAMCY" />
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
            <source media="(max-width: 680px)" srcSet="/images/Mobile/Hero-mobile.png" />
            <img src="/images/Hero_Desktop.png" alt="" fetchPriority="high" />
          </picture>
        </div>
        <div className="hero__shade" />
        <div className="hero__meta">
          <span>Москва</span>
          <span>Арт-объекты</span>
          <span>One of one</span>
        </div>
        <div className="hero__content">
          <h1>Граффити-зеркала<br />для вашего пространства</h1>
          <p>Граффити, которое можно повесить дома — зеркало с уникальным дизайном.</p>
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
          <p className="section-intro">Каждое зеркало — уникальный арт-объект с индивидуальным рисунком. Закажите по своему дизайну, или доверьте его разработку мне.</p>
        </div>
        <div className="works-carousel" data-reveal>
          <div className="works-carousel__image">
            <div className="works-carousel__track" style={{ transform: `translate3d(-${activeWork * 100}%, 0, 0)` }}>
              {works.map((work) => (
                <div className="works-carousel__slide" key={work.name}>
                  <img src={work.image} alt={`Граффити-зеркало ${work.name}`} onClick={() => setLightbox(work.image)} />
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
          <img src="/images/ramcy.png" alt="Виталий RAMCY за работой" loading="lazy" />
          <span>RAMCY / MOSCOW</span>
        </div>
        <div className="artist__text" data-reveal>
          <p className="eyebrow">03 / Автор</p>
          <h2>Идея, рождённая<br />из любви к <em>уличному искусству.</em></h2>
          <p>Меня зовут Виталий Гуров, в граффити известен как RAMCY — уличный художник и блогер из Москвы. Я придумал граффити-зеркала — кастомные арт-объекты, которые объединяют функциональность зеркала и выразительность уличного искусства.</p>
          <p>Первые продажи проходили через мой блог: люди увидели работы, влюбились в идею и заказывали зеркала для дома, студий и в подарок. Теперь мы отправляем наши зеркала по всему миру. А производим их в Москве. Каждое зеркало — арт-объект, разработанный в единственном экземпляре с вашим уникальным дизайном. Вы выбираете размер, цвета контуров, а также эскиз для будущего зеркала.</p>
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
          <source media="(max-width: 680px)" srcSet="/images/Mobile/Mobile-2.png" />
          <img src="/images/3.webp" alt="Девушка держит граффити-зеркало на фоне серой бетонной стены" loading="lazy" />
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
                <a href="#contact" aria-label={`Заказать зеркало ${item.size} сантиметров`}><ArrowIcon /></a>
              </div>
            </article>
          ))}
        </div>
        <p className="price-note">Доставка рассчитывается отдельно после согласования города и размера.</p>
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
                <img src={image} alt="Отзыв клиента" loading="lazy" onClick={() => setLightbox(image)} />
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
          <p>Расскажите, какой размер зеркала вы бы хотели? Нужно ли будет придумать дизайн, или он уже есть? Я свяжусь с вами и обсудим детали заказа.</p>
          <a href="https://t.me/ramcy_graffiti" target="_blank" rel="noreferrer">@ramcy_graffiti <ArrowIcon /></a>
        </div>
        <form className="contact__form" data-reveal onSubmit={(event) => event.preventDefault()}>
          <label>Как тебя зовут?<input type="text" name="name" autoComplete="name" placeholder="Имя" /></label>
          <label>Куда написать?<input type="text" name="contact" placeholder="Телефон или Telegram" /></label>
          <label>Пожелания по размеру и дизайну<textarea name="idea" rows={4} placeholder="Какой размер зеркала хотите? Дизайн есть или придумать?" /></label>
          <button type="submit">Отправить заявку <ArrowIcon /></button>
          <p>Нажимая кнопку, ты соглашаешься с политикой конфиденциальности.</p>
        </form>
      </section>

      <footer>
        <a className="brand" href="#top"><img src="/images/GrafitLogo.png" alt="VITALIY RAMCY" /></a>
        <p><span onClick={() => { window.location.hash = 'admin'; setAdminOpen(true) }}>Граффити</span>-зеркала · Москва</p>
        <div>
          <a href="tel:+79778665350">+7 977 866-53-50</a>
          <a href="mailto:ya@vitaligurov.ru">ya@vitaligurov.ru</a>
          <a href="https://t.me/ramcy_graffiti" target="_blank" rel="noreferrer">Telegram</a>
        </div>
        <small>© 2026 Vitaliy Ramcy</small>
      </footer>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </main>
  )
}

export default App
