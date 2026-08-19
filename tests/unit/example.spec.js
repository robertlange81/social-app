import { PARTIES, PARTY_COLORS, partyTextColor } from '@/constants/parties'

describe('party constants', () => {
  it('contains unique, alphabetically sorted parties with colors', () => {
    expect(new Set(PARTIES).size).toBe(PARTIES.length)
    expect(PARTIES).toEqual([...PARTIES].sort((a, b) => a.localeCompare(b, 'de')))
    PARTIES.forEach(party => expect(PARTY_COLORS[party]).toMatch(/^#[0-9A-F]{6}$/i))
  })

  it('uses dark text on the yellow FDP background', () => {
    expect(partyTextColor('FDP')).toBe('#191C1E')
    expect(partyTextColor('SPD')).toBe('#FFFFFF')
  })
})
