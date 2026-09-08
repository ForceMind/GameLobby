const reasonLabels = {
  wealthLevel: 'games.gateWealthLevel',
  charmLevel: 'games.gateCharmLevel',
  minBalance: 'games.gateMinBalance',
  playLevel: 'games.gatePlayLevel',
  genders: 'games.gateGenders',
  familyOnly: 'games.gateFamilyOnly',
}

export function gameGateText(reason, t, format) {
  if (reason.key === 'familyOnly') return t('games.gateFamilyOnly')
  const genderLabel = (value) => t(value === 'male' ? 'games.genderMale' : 'games.genderFemale')
  const need = reason.key === 'genders'
    ? reason.need.map(genderLabel).join(' / ')
    : format.number(reason.need)
  const have = reason.have == null
    ? t('games.gateUnknown')
    : reason.key === 'genders' ? genderLabel(reason.have) : format.number(reason.have)
  return t(reasonLabels[reason.key], { need, have })
}
