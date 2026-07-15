DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM member_bank_accounts GROUP BY user_id HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Cannot enforce one member bank account per user: duplicate user_id rows exist';
  END IF;
  IF EXISTS (SELECT 1 FROM member_bank_accounts GROUP BY account_number HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Cannot enforce unique member bank account numbers: duplicate account_number rows exist';
  END IF;
END $$;

CREATE UNIQUE INDEX "member_bank_accounts_user_id_key" ON "member_bank_accounts"("user_id");
CREATE UNIQUE INDEX "member_bank_accounts_account_number_key" ON "member_bank_accounts"("account_number");
