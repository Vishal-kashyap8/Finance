function normalizeBankName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeAccountNumber(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function profileAndAccountMatch(profile, account) {
  const sameBank = normalizeBankName(profile.BankName) === normalizeBankName(account.BankName);
  const profileNumber = normalizeAccountNumber(profile.AccountNumber);
  const accountNumber = normalizeAccountNumber(account.AccountNumber);
  const sameAccountNumber = profileNumber && accountNumber && profileNumber === accountNumber;

  // If there is no account-number available on one side, fall back to nickname as a softer match.
  const sameNickname = !profileNumber && !accountNumber &&
    normalizeBankName(profile.Nickname) === normalizeBankName(account.Nickname);

  return sameBank && (sameAccountNumber || sameNickname);
}

function enrichProfilesWithAccounts(profiles, accounts) {
  return profiles.map(profile => {
    const matched = accounts.find(account => profileAndAccountMatch(profile, account));
    return {
      ...profile,
      LinkedAccountID: matched?.AccountID ?? null,
      LinkedAccountNickname: matched?.Nickname ?? null,
      LinkedAccountBankName: matched?.BankName ?? null,
      LinkedAccountNumber: matched?.AccountNumber ?? null,
      LinkedAccountRelationship: matched ? 'matched' : null,
    };
  });
}

function enrichAccountsWithProfiles(accounts, profiles) {
  return accounts.map(account => {
    const matched = profiles.find(profile => profileAndAccountMatch(profile, account));
    return {
      ...account,
      LinkedProfileID: matched?.ProfileID ?? null,
      LinkedProfileNickname: matched?.Nickname ?? null,
      LinkedProfileBankName: matched?.BankName ?? null,
      LinkedProfileAccountNumber: matched?.AccountNumber ?? null,
      LinkedProfileRelationship: matched ? 'matched' : null,
    };
  });
}

module.exports = {
  enrichProfilesWithAccounts,
  enrichAccountsWithProfiles,
  normalizeAccountNumber,
  normalizeBankName,
};
