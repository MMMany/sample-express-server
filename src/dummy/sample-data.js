const _ = require("lodash");
const { AutoEncryptionLoggerLevel } = require("mongodb");

const SAMPLE_DATA = {
  TestVersion: {
    id: "v1",
    desc: "It is test version",
    TestCategory: [
      {
        id: "cat-1",
        desc: "It is test category 1",
        TestSuite: [
          {
            id: "suite-1",
            desc: "It is test suite 1",
            TestCases: [
              {
                id: "tc-1",
                desc: "It is tc 1",
              },
              {
                id: "tc-2",
                desc: "It is tc 2",
              },
              {
                id: "tc-3",
                desc: "It is tc 3",
              },
            ],
          },
          {
            id: "suite-2",
            desc: "It is test suite 2",
            TestCases: {
              id: "tc-4",
              desc: "It is tc 4",
            },
          },
        ],
      },
      {
        id: "cat-2",
        desc: "It is test category 2",
        TestSuite: {
          id: "suite-1",
          desc: "It is test suite 1",
          TestCases: [
            {
              id: "tc-11",
              desc: "It is tc 11",
            },
            {
              id: "tc-22",
              desc: "It is tc 22",
            },
            {
              id: "tc-33",
              desc: "It is tc 33",
            },
          ],
        },
      },
    ],
  },
};

const createValue = (id, desc) => {
  return { id, desc };
};

const convertData = () => {
  const root = SAMPLE_DATA.TestVersion;
  const { id, desc } = root;
  const rootValue = createValue(id, desc);

  const ret = [];

  const asArray = (data) => {
    return !_.isArray(data) ? [data] : data;
  };

  for (const cat of asArray(root.TestCategory)) {
    const { id, desc } = cat;
    const catValue = createValue(id, desc);
    for (const suite of asArray(cat.TestSuite)) {
      const { id, desc } = suite;
      const suiteValue = createValue(id, desc);
      for (const tc of asArray(suite.TestCases)) {
        const { id, desc } = tc;
        ret.push({
          id,
          desc,
          TestVersion: rootValue,
          TestCategory: catValue,
          TestSuite: suiteValue,
        });
      }
    }
  }

  return ret;
};

const SAMPLE_DATA_2 = convertData();

const convertJson = (data) => {
  // check
  const version = data[0].TestVersion;
  for (const tc of data) {
    if (tc.TestVersion.id !== version.id) {
      throw new Error("invalid data");
    }
  }

  // convert
  const ret = {
    TestVersion: {
      id: version.id,
      desc: version.desc,
      TestCategory: [],
    },
  };
  for (const tc of data) {
    let category = ret.TestVersion.TestCategory?.find((v) => v.id === tc.TestCategory.id);
    if (!category) {
      category = _.cloneDeep(tc.TestCategory);
      category.TestSuite = [];
      ret.TestVersion.TestCategory.push(category);
    }
    let suite = category.TestSuite.find((v) => v.id === tc.TestSuite.id);
    if (!suite) {
      suite = _.cloneDeep(tc.TestSuite);
      suite.TestCases = [];
      category.TestSuite.push(suite);
    }
    suite.TestCases.push(_.cloneDeep({ id: tc.id, desc: tc.desc }));
  }

  return ret;
};

module.exports = {
  SAMPLE_DATA,
  SAMPLE_DATA_2,
  convertJson,
};
