export type Locale = 'hr' | 'en'

type Dict = Record<string, string>

const hr: Dict = {
  'nav.home': 'Početna',
  'nav.galleries': 'Galerije',
  'nav.events': 'Kalendar',
  'nav.posts': 'Blog',
  'nav.search': 'Traži',
  'nav.admin': 'Admin',
  'nav.theme': 'Tema',

  'common.loading': 'Učitavanje…',
  'common.empty': 'Još nema sadržaja.',
  'common.back': 'Natrag',
  'common.save': 'Spremi',
  'common.cancel': 'Odustani',
  'common.delete': 'Obriši',
  'common.edit': 'Uredi',
  'common.publish': 'Objavi',
  'common.draft': 'Skica',
  'common.photos': 'fotografija',
  'common.searchPlaceholder': 'Pretraži fotografije…',

  'home.viewWork': 'Pogledaj radove',
  'home.contact': 'Kontakt',
  'home.featured': 'Istaknute galerije',
  'home.latest': 'Najnoviji postovi',
  'home.seeAll': 'Pogledaj sve',
  'home.about': 'O meni',
  'home.socialWall': 'S društvenih mreža',

  'gallery.backToGalleries': 'Sve galerije',
  'gallery.eventDate': 'Datum',
  'gallery.location': 'Lokacija',

  'events.upcoming': 'Nadolazeći',
  'events.past': 'Prošli',

  'admin.signIn': 'Prijava',
  'admin.password': 'Lozinka',
  'admin.signInBtn': 'Prijavi se',
  'admin.dashboard': 'Nadzorna ploča',
  'admin.upload': 'Novi upload',
  'admin.galleries': 'Galerije',
  'admin.events': 'Kalendar',
  'admin.posts': 'Objave',
  'admin.pages': 'Stranice',
  'admin.settings': 'Postavke',
  'admin.logout': 'Odjava',
  'admin.viewSite': 'Pogledaj site',
}

const en: Dict = {
  'nav.home': 'Home',
  'nav.galleries': 'Galleries',
  'nav.events': 'Calendar',
  'nav.posts': 'Blog',
  'nav.search': 'Search',
  'nav.admin': 'Admin',
  'nav.theme': 'Theme',

  'common.loading': 'Loading…',
  'common.empty': 'Nothing here yet.',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.publish': 'Publish',
  'common.draft': 'Draft',
  'common.photos': 'photos',
  'common.searchPlaceholder': 'Search photos…',

  'home.viewWork': 'View work',
  'home.contact': 'Contact',
  'home.featured': 'Featured galleries',
  'home.latest': 'Latest posts',
  'home.seeAll': 'See all',
  'home.about': 'About',
  'home.socialWall': 'From social media',

  'gallery.backToGalleries': 'All galleries',
  'gallery.eventDate': 'Date',
  'gallery.location': 'Location',

  'events.upcoming': 'Upcoming',
  'events.past': 'Past',

  'admin.signIn': 'Sign in',
  'admin.password': 'Password',
  'admin.signInBtn': 'Sign in',
  'admin.dashboard': 'Dashboard',
  'admin.upload': 'New upload',
  'admin.galleries': 'Galleries',
  'admin.events': 'Calendar',
  'admin.posts': 'Posts',
  'admin.pages': 'Pages',
  'admin.settings': 'Settings',
  'admin.logout': 'Log out',
  'admin.viewSite': 'View site',
}

const dicts: Record<Locale, Dict> = { hr, en }

export function tr(locale: Locale | undefined, key: string): string {
  const d = dicts[locale === 'en' ? 'en' : 'hr'] ?? hr
  return d[key] ?? hr[key] ?? key
}
