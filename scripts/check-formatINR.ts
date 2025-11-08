import { formatINR } from '../src/lib/currency'

const samples: Array<number | null | undefined> = [null, undefined, 0, 1, 12.3, 1234.5, 9999999.99]

for (const v of samples) {
  console.log(String(v).padEnd(12), '=>', formatINR(v as any))
}
