import { generateBarsForVote } from "./generateBarsForVote";
import { BigNumber } from "ethers";

describe("generateBarsForVote", () => {
  it("works with empty votes", () => {
    expect(
      Array.from(
        generateBarsForVote(
          BigNumber.from(0),
          BigNumber.from(0),
          BigNumber.from(0)
        )
      )
    ).toMatchInlineSnapshot(`
      Array [
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
      ]
    `);
  });

  it("works with all for votes", () => {
    expect(
      Array.from(
        generateBarsForVote(
          BigNumber.from(1),
          BigNumber.from(0),
          BigNumber.from(0)
        )
      )
    ).toMatchInlineSnapshot(`
      Array [
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
      ]
    `);
  });

  it("works for mixed votes", () => {
    expect(
      Array.from(
        generateBarsForVote(
          BigNumber.from(1),
          BigNumber.from(2),
          BigNumber.from(3)
        )
      )
    ).toMatchInlineSnapshot(`
      Array [
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "FOR",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "ABSTAIN",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
        "AGAINST",
      ]
    `);
  });
});
