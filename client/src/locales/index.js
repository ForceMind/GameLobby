// Player-facing message catalogues, one file per language.
// Generated shape: { "<stable.key>": "<text>" }. English is the fallback and must
// stay complete; the others are filled in through the admin translation module.
// Adding a language = add a row to registry.js and a JSON file here.
//
// These are imported statically so the translator stays synchronous. The catalogue
// size guard in i18n.test.js fails the build once the bundled payload grows past the
// threshold, at which point this should switch to per-locale lazy loading.

import zh_Hans from './zh-Hans.json' with { type: 'json' }
import zh_Hant from './zh-Hant.json' with { type: 'json' }
import en from './en.json' with { type: 'json' }
import es from './es.json' with { type: 'json' }
import pt_BR from './pt-BR.json' with { type: 'json' }
import fr from './fr.json' with { type: 'json' }
import de from './de.json' with { type: 'json' }
import it from './it.json' with { type: 'json' }
import ru from './ru.json' with { type: 'json' }
import ja from './ja.json' with { type: 'json' }
import ko from './ko.json' with { type: 'json' }
import ar from './ar.json' with { type: 'json' }
import hi from './hi.json' with { type: 'json' }
import id from './id.json' with { type: 'json' }
import th from './th.json' with { type: 'json' }
import vi from './vi.json' with { type: 'json' }
import tr from './tr.json' with { type: 'json' }
import pl from './pl.json' with { type: 'json' }
import nl from './nl.json' with { type: 'json' }
import ms from './ms.json' with { type: 'json' }
import fil from './fil.json' with { type: 'json' }
import bn from './bn.json' with { type: 'json' }
import fa from './fa.json' with { type: 'json' }
import uk from './uk.json' with { type: 'json' }

const messages = {
  'zh-Hans': zh_Hans,
  'zh-Hant': zh_Hant,
  'en': en,
  'es': es,
  'pt-BR': pt_BR,
  'fr': fr,
  'de': de,
  'it': it,
  'ru': ru,
  'ja': ja,
  'ko': ko,
  'ar': ar,
  'hi': hi,
  'id': id,
  'th': th,
  'vi': vi,
  'tr': tr,
  'pl': pl,
  'nl': nl,
  'ms': ms,
  'fil': fil,
  'bn': bn,
  'fa': fa,
  'uk': uk,
}

export default messages
