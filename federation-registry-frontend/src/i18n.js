import i18n from 'i18next'
import LanguageDetector from "i18next-browser-languagedetector"
import {initReactI18next} from 'react-i18next'
import XHR from 'i18next-xhr-backend'
import config from './config.json'
import languageEN from './locate/en/translate.json'
import languageGR from './locate/gr/translate.json'
import languageCZ from './locate/cz/translate.json'

const resources = {}

const localeModules = {
    en: languageEN,
    gr: languageGR,
    cz: languageCZ
}

config.allowedLocales.forEach(locale => {
    if (localeModules[locale]) {
        resources[locale] = localeModules[locale]
    } else if (locale !== config.defaultLocale) {
        console.warn(`Locale '${locale}' is configured but no translation file exists. Using fallback.`)
    }
})

i18n
.use(XHR)
.use(LanguageDetector)
.use(initReactI18next)
.init({
    resources: resources,
    /* default language when load the website in browser */
    lng: config.defaultLocale,
    /* When react i18next not finding any language to as default in browser */
    fallbackLng: {
        // All non-allowed languages fall back to default locale
        'gr': [config.defaultLocale],
        'cs': [config.defaultLocale],
        'default': [config.defaultLocale]
    },
    /* List of supported locales - only allows configured languages */
    supportedLngs: config.allowedLocales,
    /* Only load locales that are in the allowed list */
    load: 'currentOnly',
    /* debugger For Development environment */
    debug: true,
    ns: ["translations"],
    defaultNS: "translations",
    keySeparator: ".",
    interpolation: {
        escapeValue: false,
        formatSeparator: ","
    },
    react: {
        wait: true,
        bindI18n: 'languageChanged loaded',
        bindStore: 'added removed',
        nsMode: 'default'
    },
    partialBundledLanguages: true
})

export default i18n;
