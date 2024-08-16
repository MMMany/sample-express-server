const _ = require("lodash");
const { TEST_STATE } = require("../constants");
const logger = require("../utils/logger");

const SAMPLE_DATA = {
  TestVersion: {
    title: "v1",
    state: TEST_STATE.NOT_TESTED,
    TestSuite: [
      {
        title: "suite-1",
        state: TEST_STATE.NOT_TESTED,
        TestCategory: [
          {
            title: "cat-1",
            state: TEST_STATE.NOT_TESTED,
            TestCase: [
              {
                title: "tc-1",
                state: TEST_STATE.NOT_TESTED,
                TestUnit: [
                  {
                    title: "unit-1",
                    state: TEST_STATE.NOT_TESTED,
                  },
                  {
                    title: "unit-2",
                    state: TEST_STATE.NOT_TESTED,
                  },
                  {
                    title: "unit-3",
                    state: TEST_STATE.NOT_TESTED,
                  },
                ],
              },
              {
                title: "tc-2",
                state: TEST_STATE.NOT_TESTED,
                TestUnit: {
                  title: "unit-1",
                  state: TEST_STATE.NOT_TESTED,
                },
              },
              {
                title: "tc-3",
                state: TEST_STATE.SKIP,
              },
            ],
          },
          {
            title: "cat-2",
            state: TEST_STATE.NOT_TESTED,
            TestCase: {
              title: "tc-4",
              state: TEST_STATE.NOT_TESTED,
              TestUnit: {
                title: "unit-1",
                state: TEST_STATE.NOT_TESTED,
              },
            },
          },
        ],
      },
      {
        title: "suite-2",
        state: TEST_STATE.NOT_TESTED,
        TestCategory: {
          title: "cat-1",
          state: TEST_STATE.NOT_TESTED,
          TestCase: [
            {
              title: "tc-11",
              state: TEST_STATE.SKIP,
            },
            {
              title: "tc-22",
              state: TEST_STATE.NOT_TESTED,
              TestUnit: [
                {
                  title: "unit-11",
                  state: TEST_STATE.NOT_TESTED,
                },
                {
                  title: "unit-22",
                  state: TEST_STATE.NOT_TESTED,
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

const asArray = (it) => {
  if (!it) return [];
  return _.isArray(it) ? it : [it];
};

const parseTreeToArray = (tree) => {
  const origin = _.cloneDeep(tree);

  const ret = [];

  const rootArr = asArray(origin.TestVersion);
  for (const [idx, ver] of rootArr.entries()) {
    const verValue = {
      id: `id::${idx}`,
      title: ver.title,
      state: ver.state,
    };
    if (!ver.TestSuite || ver.state === TEST_STATE.SKIP) {
      ret.push(verValue);
      continue;
    }
    const suiteArr = asArray(ver.TestSuite);
    for (const [idx, suite] of suiteArr.entries()) {
      const suiteValue = {
        id: verValue.id + `-${idx}`,
        title: suite.title,
        state: suite.state,
      };
      if (!suite.TestCategory || suite.state === TEST_STATE.SKIP) {
        suiteValue.TestVersion = verValue;
        ret.push(suiteValue);
        continue;
      }
      const categoryArr = asArray(suite.TestCategory);
      for (const [idx, cat] of categoryArr.entries()) {
        const catValue = {
          id: suiteValue.id + `-${idx}`,
          title: cat.title,
          state: cat.state,
        };
        if (!cat.TestCase || cat.state === TEST_STATE.SKIP) {
          catValue.TestVersion = verValue;
          catValue.TestSuite = suiteValue;
          ret.push(catValue);
          continue;
        }
        const testCaseArr = asArray(cat.TestCase);
        for (const [idx, tc] of testCaseArr.entries()) {
          const tcValue = {
            id: catValue.id + `-${idx}`,
            title: tc.title,
            state: tc.state,
          };
          if (!tc.TestUnit || tc.state === TEST_STATE.SKIP) {
            tcValue.TestVersion = verValue;
            tcValue.TestSuite = suiteValue;
            tcValue.TestCategory = catValue;
            ret.push(tcValue);
            continue;
          }
          const unitArr = asArray(tc.TestUnit);
          for (const [idx, unit] of unitArr.entries()) {
            const unitValue = {
              id: tcValue.id + `-${idx}`,
              title: unit.title,
              state: unit.state,
              TestVersion: verValue,
              TestSuite: suiteValue,
              TestCategory: catValue,
              TestCase: tcValue,
            };
            ret.push(unitValue);
          }
        }
      }
    }
  }

  return ret;
};

const parseArrayToTree = (arr) => {
  if (_.isEmpty(arr)) throw new Error("empty arr");

  const origin = _.cloneDeep(arr);

  // check
  const version = origin[0].TestVersion;
  if (!version) throw new Error("invalid version");
  for (const it of origin) {
    if (it.TestVersion.id !== version.id) throw new Error("version corrupted");
  }

  // parse
  const ret = {
    TestVersion: {
      id: version.id,
      title: version.title,
      state: version.state,
      TestSuite: [],
    },
  };

  for (const it of origin) {
    let suite = ret.TestVersion.TestSuite?.find((v) => v.id === it.TestSuite?.id);
    if (!suite) {
      if (!it.TestSuite) {
        ret.TestVersion.TestSuite.push(
          _.cloneDeep({
            id: it.id,
            title: it.title,
            state: it.state,
          })
        );
        continue;
      }
      suite = _.cloneDeep(it.TestSuite);
      ret.TestVersion.TestSuite.push(suite);
      if (suite.state === TEST_STATE.SKIP) {
        continue;
      }
      suite.TestCategory = [];
    }
    let category = suite.TestCategory.find((v) => v.id === it.TestCategory?.id);
    if (!category) {
      if (!it.TestCategory) {
        suite.TestCategory.push(
          _.cloneDeep({
            id: it.id,
            title: it.title,
            state: it.state,
          })
        );
        continue;
      }
      category = _.cloneDeep(it.TestCategory);
      suite.TestCategory.push(category);
      if (category.state === TEST_STATE.SKIP) {
        continue;
      }
      category.TestCase = [];
    }
    let tc = category.TestCase.find((v) => v.id === it.TestCase?.id);
    if (!tc) {
      if (!it.TestCase) {
        category.TestCase.push(
          _.cloneDeep({
            id: it.id,
            title: it.title,
            state: it.state,
          })
        );
        continue;
      }
      tc = _.cloneDeep(it.TestCase);
      category.TestCase.push(tc);
      if (tc.state === TEST_STATE.SKIP) {
        continue;
      }
      tc.TestUnit = [];
    }
    tc.TestUnit.push(
      _.cloneDeep({
        id: it.id,
        title: it.title,
        state: it.state,
      })
    );
  }

  return ret;
};

module.exports = {
  SAMPLE_DATA,
  parseTreeToArray,
  parseArrayToTree,
};
