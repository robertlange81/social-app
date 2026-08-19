import { SPECIES, PURPOSES, GENDERS, purposeLabel } from '@/constants/pets'

describe('pet constants', () => {
  it('contains the API values used by forms and filters', () => {
    expect(SPECIES.map(item => item.value)).toEqual(['dog', 'cat'])
    expect(GENDERS.map(item => item.value)).toEqual(['male', 'female'])
    expect(PURPOSES.map(item => item.value)).toEqual(['breeding', 'playmate', 'both'])
  })

  it('returns readable purpose labels', () => {
    expect(purposeLabel('breeding')).toBe('Zuchtpartner')
    expect(purposeLabel('playmate')).toBe('Spielpartner')
    expect(purposeLabel('both')).toBe('Beides')
  })
})
