/**
 * Build preset for dsh-myskin: a UI plugin client bundle in the exact
 * closure-factory format the DSH dsh-client-modules loader serves at
 * /plugins/<id>/client.js, plus the Node Host half.
 *
 * Build from the DSH repository root so its toolchain (tsdown + lightningcss
 * + repo preset) and @deepseek-ai packages resolve:
 *   cd D:/Mochen/Project/deepseek-harness
 *   node_modules/.bin/tsdown --config D:/Mochen/Project/dsh-myskin/tsdown.config.ts --env.DSH_BUILD_FACE client
 */
import { clientBundle } from '../deepseek-harness/packages/client/tsdown.client.ts'

export default clientBundle('dsh-myskin', ['lib/types/index.js'])
