import Account from "../model/AccountSchema.ts";

const createBankAccount = async (
  userId: string,
  phonenumber: string,
  balance: number = 10000
) => {
  const accountNumber = phonenumber.substring(1);
  await Account.create({
    userId,
    accountNumber,
    balance,
  });
};

export default createBankAccount;
