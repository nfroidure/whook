# [8.4.0](https://github.com/nfroidure/whook/compare/v8.3.0...v8.4.0) (2021-09-24)


### Features

* **compiler:** allow to exclude node_modules from the build ([9d4bf19](https://github.com/nfroidure/whook/commit/9d4bf19771fbad4c1feeae84e0bfe15ea73319be))



# [8.3.0](https://github.com/nfroidure/whook/compare/v8.2.0...v8.3.0) (2021-09-24)


### Features

* **libs:** add tools to deal with OpenAPI data ([9241cf7](https://github.com/nfroidure/whook/commit/9241cf7347ae64d04fd8b26c429662051bf37a07))



## [8.1.1](https://github.com/nfroidure/whook/compare/v8.1.0...v8.1.1) (2021-06-08)


### Bug Fixes

* **@whook/aws-lambda:** fix crons HTTP compatibility ([401d5af](https://github.com/nfroidure/whook/commit/401d5af82642e27916fdd2810305edb263d6baec))



# [8.1.0](https://github.com/nfroidure/whook/compare/v8.0.4...v8.1.0) (2021-06-08)


### Bug Fixes

* **@whook/aws-lambda:** fix default parameters value ([44d527a](https://github.com/nfroidure/whook/commit/44d527a2831481ac30bdc5a8915f868a1ed17ca0))
* **@whook/http-router:** better error for bad status ([6c734b3](https://github.com/nfroidure/whook/commit/6c734b3ed05ae282e197a595f2c3c7d0f24465ee)), closes [#110](https://github.com/nfroidure/whook/issues/110)
* **docs:** fix typo and formatting ([66380ba](https://github.com/nfroidure/whook/commit/66380baf1d2ba2d9ee487b342727f4e2a4458cee))



## [8.0.4](https://github.com/nfroidure/whook/compare/v8.0.3...v8.0.4) (2021-04-11)


### Bug Fixes

* **@whook/cli:** ensure CLI commands fail with args errors ([240b314](https://github.com/nfroidure/whook/commit/240b3141c7ec5a4232265f4b2770e192a645a475))
* **core:** avoid exiting the process when everything is ok ([a5fd866](https://github.com/nfroidure/whook/commit/a5fd86643af8f62f069e38dedfbd655d2a8699fd))



## [8.0.3](https://github.com/nfroidure/whook/compare/v8.0.2...v8.0.3) (2021-03-04)


### Bug Fixes

* **@whook/http-transaction:** prefer interfaces and fix regression on types ([f1a0dad](https://github.com/nfroidure/whook/commit/f1a0dad8f2a846e140112cba59cbbf2375b1a0a9))
* **@whook/whook:** keep names for the build ([590c3ff](https://github.com/nfroidure/whook/commit/590c3ff7b4f807dc91d4e0989033d7db946b22a9))



## [8.0.2](https://github.com/nfroidure/whook/compare/v8.0.1...v8.0.2) (2021-03-03)


### Bug Fixes

* **@whook/http-router:** fix ajv validation of formats ([3d59215](https://github.com/nfroidure/whook/commit/3d5921571009d47ecfd3597d18f4456bae3c3068))



## [8.0.1](https://github.com/nfroidure/whook/compare/v8.0.0...v8.0.1) (2021-03-03)


### Bug Fixes

* **@whook/http-router:** fix  compatibility issue ([e0b3a60](https://github.com/nfroidure/whook/commit/e0b3a60e783678d7ae136a7d38a1c5f36ca76ee3))



# [8.0.0](https://github.com/nfroidure/whook/compare/v7.1.5...v8.0.0) (2021-03-03)


### Code Refactoring

* **build:** isolate build functions ([17f810e](https://github.com/nfroidure/whook/commit/17f810e114893c1ae4c350878cfed69421b854ed)), closes [#104](https://github.com/nfroidure/whook/issues/104)
* **build:** use `esbuild` intead of `webpack` ([bdfcd2f](https://github.com/nfroidure/whook/commit/bdfcd2f3333295e73f3569bb957742dbb88f4a88))


### Features

* **@whook/aws-lambda:** support NodeJS14 ([f4569eb](https://github.com/nfroidure/whook/commit/f4569eb701263c1ae2c258256d43437547f5361b))


### BREAKING CHANGES

* **build:** The compiler were moved up to the `@whook/whook` project since it was the same for
AWS/GCP and could be reused for other kinds of builds. Also existing project will have to remove
`babel-loader`, `webpack` of dev dependencies and add `esbuild` instead.
* **build:** Simply moving functions from `index.ts` to `build.ts`.



## [7.1.5](https://github.com/nfroidure/whook/compare/v7.1.4...v7.1.5) (2021-02-11)


### Bug Fixes

* **@whook/aws-lambda:** fix error descriptor matching ([d8de8c5](https://github.com/nfroidure/whook/commit/d8de8c512725fb7ec8058babd74b7928a2f29481))
* **@whook/cli:** fix command definition type ([b3b42ab](https://github.com/nfroidure/whook/commit/b3b42abde712ec093274e1f007610ca77ae4f3b4))



## [7.1.4](https://github.com/nfroidure/whook/compare/v7.1.3...v7.1.4) (2021-01-12)



## [7.1.3](https://github.com/nfroidure/whook/compare/v7.1.2...v7.1.3) (2021-01-11)


### Bug Fixes

* **dependencies:** fix dependencies hoisting ([289b0f6](https://github.com/nfroidure/whook/commit/289b0f64ed0fcd30415f31183aaa59d3e0bf4f02))
* **types:** fix open api types ([4188781](https://github.com/nfroidure/whook/commit/418878182a22d7395ff7ae5980d9a935cb0925f6)), closes [#101](https://github.com/nfroidure/whook/issues/101) [kogosoftwarellc/open-api#703](https://github.com/kogosoftwarellc/open-api/issues/703)



## [7.1.1](https://github.com/nfroidure/whook/compare/v7.1.0...v7.1.1) (2021-01-04)


### Bug Fixes

* **@whook/aws-lambda:** fix the HTTP wrapper ([aacd6c3](https://github.com/nfroidure/whook/commit/aacd6c38511ebac61dff9f9a21fb051bc170db1d))
* **@whook/cors:** fix CORS when errors are casted ([6c18a87](https://github.com/nfroidure/whook/commit/6c18a8701e3e6437cebf7dd93c5e332423e3a9ee))



# [7.1.0](https://github.com/nfroidure/whook/compare/v7.0.0...v7.1.0) (2020-12-27)


### Features

* **@whook/whook:** add warning for API overrides ([e3efc4b](https://github.com/nfroidure/whook/commit/e3efc4b2e740cc100ad72f6751c33aef90817f8c)), closes [#98](https://github.com/nfroidure/whook/issues/98)



# [7.0.0](https://github.com/nfroidure/whook/compare/v6.0.0...v7.0.0) (2020-12-22)


### Bug Fixes

* **types:** fix types ([78298d9](https://github.com/nfroidure/whook/commit/78298d90c68169369e25f7a84cf3fec9e4a77177))


### Code Refactoring

* **@whook/aws-lambda:** refactor lambda triggers ([f948220](https://github.com/nfroidure/whook/commit/f94822082be0b1c243c64ffec202e992330bee49)), closes [#95](https://github.com/nfroidure/whook/issues/95) [#96](https://github.com/nfroidure/whook/issues/96)


### BREAKING CHANGES

* **@whook/aws-lambda:** The consumers do not manage batchs anymore and simply pass the records to the
lambda implementation in order to avoid having to write custom wrappers for each event type. The
user are now free to handle the batchs the way they want.



# [6.0.0](https://github.com/nfroidure/whook/compare/v5.1.8...v6.0.0) (2020-12-09)


### Bug Fixes

* **@whook/example:** fix the watch script to completely wait for the server restart ([2d616f7](https://github.com/nfroidure/whook/commit/2d616f759fb3390e1a82f89661047e4b0a4d3234))
* **dependencies:** update knifecycle ([351a9c4](https://github.com/nfroidure/whook/commit/351a9c4aae4c94f797e8fc76614384840e562c8f))
* **doc:** regenerate the changelog ([d7234dc](https://github.com/nfroidure/whook/commit/d7234dc596dba94f55a9917118880b413c0de457))
* **docs:** remove version from the root package ([487f02d](https://github.com/nfroidure/whook/commit/487f02d5ec548e2ea1cdd97a3827ee3cbb6a578a)), closes [#70](https://github.com/nfroidure/whook/issues/70)



## [5.1.6](https://github.com/nfroidure/whook/compare/v5.1.5...v5.1.6) (2020-11-05)


### Bug Fixes

* **@whook/http-router:** fix enum testing ([41dd4ea](https://github.com/nfroidure/whook/commit/41dd4eaa02024c3a000dc8f0101fd2f99c75696d))



## [5.1.5](https://github.com/nfroidure/whook/compare/v5.1.4...v5.1.5) (2020-11-05)


### Bug Fixes

* **@whook/http-router:** fix headers casting ([5566a1d](https://github.com/nfroidure/whook/commit/5566a1d726c2a3e23aa40c8ae9190144c1461e61))



## [5.1.4](https://github.com/nfroidure/whook/compare/v5.1.3...v5.1.4) (2020-10-29)


### Bug Fixes

* **commands:** fix AWS/GCP test commands ([4db35ea](https://github.com/nfroidure/whook/commit/4db35eac4a860742c385752c840244a45a84585c))
* **dependencies:** align dependencies versions ([32136d4](https://github.com/nfroidure/whook/commit/32136d4d3e0f716d514ddce8652a62fb44a16a86))


### Features

* **@whook/http-router:** allow recursive schemas in the API definition ([60eda00](https://github.com/nfroidure/whook/commit/60eda00dc87dcbe4cd24a23a266b15e3e08a941d)), closes [#91](https://github.com/nfroidure/whook/issues/91)



## [5.1.3](https://github.com/nfroidure/whook/compare/v5.1.2...v5.1.3) (2020-10-28)


### Bug Fixes

* **@whook/aws-lambda:** fix support for multi-valued query parameters ([02546b5](https://github.com/nfroidure/whook/commit/02546b575d1868a41fbe221b7f7341b3e3d6e95d))



## [5.1.2](https://github.com/nfroidure/whook/compare/v5.1.1...v5.1.2) (2020-10-19)


### Bug Fixes

* **cookies:** avoid specifying sameSite for local dev ([2e4aa8d](https://github.com/nfroidure/whook/commit/2e4aa8d9eb6ab51415178e1da797802a5e71a4c9))



## [5.1.1](https://github.com/nfroidure/whook/compare/v5.1.0...v5.1.1) (2020-10-05)


### Bug Fixes

* **@whook/aws-lambda:** fix lambdas build for multiple headers ([ed5537a](https://github.com/nfroidure/whook/commit/ed5537a3ac0f71afe9c78e3895e266444fdab607))
* **@whook/oauth2:** fix cookies for dev env ([51776df](https://github.com/nfroidure/whook/commit/51776df13d42c7f912f3c32ddb70e06103a80ff9))
* **build:** fix the lambda/gcp builds ([b97b774](https://github.com/nfroidure/whook/commit/b97b77411b7404692f094c35c63c9f994e230f04))



# [5.1.0](https://github.com/nfroidure/whook/compare/v5.0.0...v5.1.0) (2020-10-01)


### Bug Fixes

* **@whook/cors:** allow to configure all CORS headers ([8b933dd](https://github.com/nfroidure/whook/commit/8b933ddc87f3d21567b1b01a49ef467a88b2dcf8))


### Features

* **@whook/cors:** add custom CORS per handlers support ([b62c068](https://github.com/nfroidure/whook/commit/b62c0689509b9ff460e2eea4e4ad538012f78a69))
* **@whook/oauth2:** add common auth endpoints ([0af41c3](https://github.com/nfroidure/whook/commit/0af41c3c13d9937b3a7913cb639aec62ab825314))



# [5.0.0](https://github.com/nfroidure/whook/compare/v4.1.2...v5.0.0) (2020-09-15)


### Code Refactoring

* **types:** use schema2dts instead of dtsgenerator ([f5d7166](https://github.com/nfroidure/whook/commit/f5d7166be136da3c7d654180022bd4cfa4089aa6))


### BREAKING CHANGES

* **types:** Typings of input/output strongly changes but allows for more clarity,
expressiveness and productivity



## [4.1.2](https://github.com/nfroidure/whook/compare/v4.1.1...v4.1.2) (2020-09-15)


### Bug Fixes

* **cors:** test if err has setter ([3451f54](https://github.com/nfroidure/whook/commit/3451f5437f60c514416d73e4bc8ecaca65ae261a))
* **tests:** fix tests after apollo graphql updates ([e8398ff](https://github.com/nfroidure/whook/commit/e8398ffb2b59f514aede9b1a371ea436bd02b97e))



## [4.1.1](https://github.com/nfroidure/whook/compare/v4.1.0...v4.1.1) (2020-08-24)


### Bug Fixes

* **@whook/create:** fix tests failure when creating a project ([96a81d7](https://github.com/nfroidure/whook/commit/96a81d7493990f6be46044a208100c0e1ec74bbf))
* **docs:** fix repo url ([2129109](https://github.com/nfroidure/whook/commit/2129109c880f8e89a12df9e16b76a70bad460a02))
* **types:** fix types imports declarations ([91d72f4](https://github.com/nfroidure/whook/commit/91d72f4c6dc2698a8204bc04715fe09b1c712652))



# [4.1.0](https://github.com/nfroidure/whook/compare/v4.0.5...v4.1.0) (2020-08-21)


### Bug Fixes

* **tests:** update tests for the new swagger-ui patch ([a4d16e0](https://github.com/nfroidure/whook/commit/a4d16e03a4dc7db4a7746a051c8f16b5999e80ef))
* **watch:** fix cache invalidation for deep dependencies ([86025c7](https://github.com/nfroidure/whook/commit/86025c757e7e0538036e98128fa76b3160773dc4))


### Features

* **dev:** watch mode and API types ([c2a0acd](https://github.com/nfroidure/whook/commit/c2a0acd6506f4cc55a57293cb4968fc0000220f8)), closes [#75](https://github.com/nfroidure/whook/issues/75) [#51](https://github.com/nfroidure/whook/issues/51)
* **types:** allow parametrization of handler definitions ([1d7a9b3](https://github.com/nfroidure/whook/commit/1d7a9b3309e7401fa8bcf9c5e4557d71c38d3079))



## [4.0.4](https://github.com/nfroidure/whook/compare/v4.0.3...v4.0.4) (2020-06-09)


### Bug Fixes

* **@whook/http-transaction:** fix error agnosticism ([90a2865](https://github.com/nfroidure/whook/commit/90a2865b58fe0a39e0b65bff8f461cccf7527dae))



## [4.0.3](https://github.com/nfroidure/whook/compare/v4.0.2...v4.0.3) (2020-05-29)


### Bug Fixes

* **@whook/oauth2:** fix camel case build issues ([cde343a](https://github.com/nfroidure/whook/commit/cde343a1459a8c4d1cb11559448fff9d447c3a61))
* **@whook/oauth2:** fix types and add some tests ([3f064d7](https://github.com/nfroidure/whook/commit/3f064d7a5a9b23a963007bef7dcc05eb13cdae38))



## [4.0.2](https://github.com/nfroidure/whook/compare/v4.0.1...v4.0.2) (2020-05-26)


### Bug Fixes

* **@whook/oauth2:** fix typings and docs mistakes ([f81d8ce](https://github.com/nfroidure/whook/commit/f81d8cec5f217c2ecbdef17c360a2ad673356994))
* **@whook/whook:** take typescript in count for API definitions ([220d016](https://github.com/nfroidure/whook/commit/220d0166f4226a8311b9f59831534ca584595e1d))



## [4.0.1](https://github.com/nfroidure/whook/compare/v4.0.0...v4.0.1) (2020-05-19)


### Bug Fixes

* **core:** fix monorepo config ([1e30e86](https://github.com/nfroidure/whook/commit/1e30e861bd8b4bd5674248f20f56e4a1aaa28e15))



# [4.0.0](https://github.com/nfroidure/whook/compare/v3.1.3...v4.0.0) (2020-05-19)


### Bug Fixes

* **@whook/aws-lambda:** fix types generation ([784211a](https://github.com/nfroidure/whook/commit/784211a2c7e417daea4b8b8b6d150065f8705b4a))
* **@whook/cli:** Add project path to the `ls` command ([6706fee](https://github.com/nfroidure/whook/commit/6706feed16f459291bb56b61f65c4cd307a3498d))
* **@whook/cli:** discard snapshots folders ([41ff048](https://github.com/nfroidure/whook/commit/41ff048f4638f394c6ff4b7308d64a1a0bea33c2)), closes [#42](https://github.com/nfroidure/whook/issues/42)
* **@whook/cli:** Fix default arguments ([adbbdeb](https://github.com/nfroidure/whook/commit/adbbdeb01564dcf3b947ddac19d994652f6eaa2d)), closes [#35](https://github.com/nfroidure/whook/issues/35)
* **@whook/cli:** Fix the script field ([7ede2f3](https://github.com/nfroidure/whook/commit/7ede2f378fe675ee479402252f1d792c51fd952b))
* **@whook/cli:** ignore mappings when autoloading ([1d64f7b](https://github.com/nfroidure/whook/commit/1d64f7bc30fb56384058e6ed68e5a0e671a30fc6))
* **@whook/cors:** Avoid requiring parameters in CORS ([fc15a89](https://github.com/nfroidure/whook/commit/fc15a8906a50fdf6be25752c40ef4edae9fb4a91))
* **@whook/cors:** Ensure determinism for CORS base operation ([f4a42d6](https://github.com/nfroidure/whook/commit/f4a42d6097a8425796ebd290324dc491826a8e34))
* **@whook/create:** Fix create script path ([f027832](https://github.com/nfroidure/whook/commit/f0278327d467eb59b9a8af2ef33c9443527b785d))
* **@whook/create:** Fix scripts syntax ([be071b0](https://github.com/nfroidure/whook/commit/be071b081a5372ee1063fe2cae85b5e43de984a4))
* **@whook/create:** Fix the README.md file ([b6b3fb4](https://github.com/nfroidure/whook/commit/b6b3fb472fb3ff9dc3c7068e9ae609e23b08d212))
* **@whook/create:** fix whook create and add an e2e test ([d4ab9b1](https://github.com/nfroidure/whook/commit/d4ab9b1ed226683617186cf8f5689de01515c1e5))
* **@whook/create:** remove noises in the generated package.json ([72ebcbf](https://github.com/nfroidure/whook/commit/72ebcbfbd3341e153b41caad2fcdee55b7134864))
* **@whook/example:** make tests rely on a more predictible value ([0e57b21](https://github.com/nfroidure/whook/commit/0e57b2100a42bfe13fd7397d0aa55406acdc6eca))
* **@whook/graphql:** fix dependencies of generated types ([144258c](https://github.com/nfroidure/whook/commit/144258c94ca944bd9a5906472a4a8d2ad6e0f26a))
* **@whook/graphql:** fix JSON parse of errors ([18af154](https://github.com/nfroidure/whook/commit/18af154aee9b22e1a5333ab2c0903af1484491a2))
* **@whook/graphql:** fix the GraphQL config ([894eea4](https://github.com/nfroidure/whook/commit/894eea4ae2b7da53f4bc724fcc8de40fbc966b1b))
* **@whook/http-router:** Use bodySpecs everywhere ([422b97d](https://github.com/nfroidure/whook/commit/422b97de3e2c1942fdc78f46a6c150f4af6f29c1))
* **@whook/whook:** Allow to autoload the service name map ([696a7b5](https://github.com/nfroidure/whook/commit/696a7b509665adc9ecc4fb8c55c289604e3fb759))
* **@whook/whook:** fix definition autoload ordering ([55f2e0a](https://github.com/nfroidure/whook/commit/55f2e0a759ce2540108eb320a8d219e77b3937e4))
* **@whook/whook:** Make integration testing logs determinists ([635784d](https://github.com/nfroidure/whook/commit/635784d7c878af1e599932f5a2da75769941ea77))
* **@whook/whook:** Set the right service name for mapped ones ([5238818](https://github.com/nfroidure/whook/commit/5238818e1e7b986473476660d6531c8d6c3b9d2f))
* **api:** fix paths generation ([2fe5e00](https://github.com/nfroidure/whook/commit/2fe5e00f1883d20ef48e4ca8a33ae4886e249114))
* **api:** hide unused tags in public mode ([c01d35f](https://github.com/nfroidure/whook/commit/c01d35f3761081a4c4a82384d5c0e8b1909e3873))
* **build:** ensure types are computed at build ([0d7b589](https://github.com/nfroidure/whook/commit/0d7b5890f8f0475bf3e2df01a96bb3a441ab1a55))
* **Build:** Fix build and add a few dev docs ([f15a8ad](https://github.com/nfroidure/whook/commit/f15a8ade9f611e8473cb3cdf0e622016e1bb9f63))
* **builds:** fix GCP and AWS builds ([3aa8473](https://github.com/nfroidure/whook/commit/3aa8473076f58b16356c94d227591b5cb44783d6))
* **core:** fix typos ([0b20a68](https://github.com/nfroidure/whook/commit/0b20a683f566bd422837483a5014e0f49314e2cd))
* **dependencies:** align dependencies ([05277d6](https://github.com/nfroidure/whook/commit/05277d6e76d18c2d14d548d91946140f84cff0e3))
* **Docs:** Fix `@whook/authorization` README layout ([de782a7](https://github.com/nfroidure/whook/commit/de782a7e8f26fd5ae0b4973b9f81a50a47b2f863))
* **Docs:** Fix old README files ([ac295da](https://github.com/nfroidure/whook/commit/ac295da7cd96d4aad07c3450a91e77e2c82b6130))
* **Test:** Fix tests path ([2ad2dcf](https://github.com/nfroidure/whook/commit/2ad2dcf2a0a000bb8f507800ca4b51227020d28e))
* **tests:** fix broken tests ([0d27a8a](https://github.com/nfroidure/whook/commit/0d27a8acf1811cc73442abc5a5cc3ab559075c54))
* **tests:** fix ci build ([c8697c6](https://github.com/nfroidure/whook/commit/c8697c6c1d7b388f08d5a94d7b854009a727edea))
* **Tests:** Fix tests ([a6b8fc8](https://github.com/nfroidure/whook/commit/a6b8fc8ca83b46c8794baf02de2f44eb6979f5fa))
* **types:** add process config to whook's one ([7919ca0](https://github.com/nfroidure/whook/commit/7919ca08a727347491b2087a6e392e707b85b90a))
* **types:** export API config types for extension ([c1882cc](https://github.com/nfroidure/whook/commit/c1882ccdfc84da9261040bfbd21aa2282563d13b))
* **types:** fix handlers generic types ordering ([2b47262](https://github.com/nfroidure/whook/commit/2b4726260840ebde1f54123d8e28e91214e943e9))
* **types:** propagate the common services types fix ([c7cd140](https://github.com/nfroidure/whook/commit/c7cd140d38d915d5d4634cc9893baebe94b32a34))
* **versions:** fix semver import for webpack ([78f5d2d](https://github.com/nfroidure/whook/commit/78f5d2ddc4b200f617a49676f0cefc511e8d3b95))
* **whook-swagger-ui:** Remove server version for tests ([74127be](https://github.com/nfroidure/whook/commit/74127be3545811d041113ec07886817e3a986d43))


### Features

* **@whook:** load handlers definitions in plugins too ([9b9eccc](https://github.com/nfroidure/whook/commit/9b9ecccd7723e45ceca2568b8c91535fe83525b5)), closes [#63](https://github.com/nfroidure/whook/issues/63)
* **@whook/authorization:** Add WWW-Authenticate header support ([36f0051](https://github.com/nfroidure/whook/commit/36f0051c3858f9f1e071201b37ad8d97b54878fa))
* **@whook/aws-lambda:** add a better query parser ([b44dc40](https://github.com/nfroidure/whook/commit/b44dc406336575da76a36c123c49aa6a15a37ec4))
* **@whook/aws-lambda:** add AWS lambda to the build ([cb4a8fc](https://github.com/nfroidure/whook/commit/cb4a8fc138e32f4363f758bc4defb4c3da691510))
* **@whook/cli:** Add a command to list commands ([8875fc6](https://github.com/nfroidure/whook/commit/8875fc6abf116a1f9a35b53ad29d780dacc95050))
* **@whook/cli:** add a command to quickly create templated files ([92b303f](https://github.com/nfroidure/whook/commit/92b303f2abee3303f27996793b8e52203cc3d9bd))
* **@whook/cli:** Add CLI args checking ([b88fa8b](https://github.com/nfroidure/whook/commit/b88fa8b3fd3962da393709cd46e01f420b775cf7))
* **@whook/cli:** allow to inspect injector results ([06b2cf4](https://github.com/nfroidure/whook/commit/06b2cf4eef4fadd80afb248496cdd132bbaf566a))
* **@whook/cli:** Allow to prompt required values ([a9ae5da](https://github.com/nfroidure/whook/commit/a9ae5dac3a018886e9d01fb179926c6338f32d51))
* **@whook/create:** Add a way to create a new Whook project ([49f9092](https://github.com/nfroidure/whook/commit/49f909228345f2486bb08eaa0fc8b8002645c717)), closes [#12](https://github.com/nfroidure/whook/issues/12)
* **@whook/create:** Install dependencies for newly created projects ([73fe278](https://github.com/nfroidure/whook/commit/73fe278ad375a6390ff93f973e9aa7d59325a27e))
* **@whook/gcp-functions:** add Google Cloud Functions build ([1525f92](https://github.com/nfroidure/whook/commit/1525f9217c83b662909619adb124b5d3dd60ba72))
* **@whook/graphiql:** add GraphIQL to the build ([1a22760](https://github.com/nfroidure/whook/commit/1a2276033da83f3b1add0c11e05d0dd9c882a2ed))
* **@whook/graphiql:** add more options ([e937aaa](https://github.com/nfroidure/whook/commit/e937aaa73b19dfa2c61d39d74006170ac2f281c8))
* **@whook/graphql:** allow to use graphql ([bd687ac](https://github.com/nfroidure/whook/commit/bd687ac014a1d55e05d6dac3e78eda93129df256))
* **@whook/http-transaction:** add APM and obfuscator services ([8fa973e](https://github.com/nfroidure/whook/commit/8fa973e868d25bfc3cf94cde8d36e0f68914979b))
* **@whook/oauth2:** add support for oauth2 ([1f126b0](https://github.com/nfroidure/whook/commit/1f126b09f6bcdcbefbf48d5cd4cc2cd274a5c76a)), closes [#60](https://github.com/nfroidure/whook/issues/60) [#18](https://github.com/nfroidure/whook/issues/18)
* **@whook/swagger-ui:** Allow to specify a dev token ([a2c6fcf](https://github.com/nfroidure/whook/commit/a2c6fcf1031b9c0c4bb899321c1554d0b206c102))
* **@whook/versions:** add the wrapper to check versions ([0034e38](https://github.com/nfroidure/whook/commit/0034e38b04f87fe96e9e27dcd376c7eef1c6f321))
* **@whook/whook:** allow to disable a given handler ([b5d7184](https://github.com/nfroidure/whook/commit/b5d7184c43fdfaa60ad780b3c716f63647eb74f9))
* **@whook/whook:** enable API filtering by tags ([3fcf306](https://github.com/nfroidure/whook/commit/3fcf306f00165116779331ecdb0cff1f79cf56d7))
* **@whook/whook:** gather api components automatically ([bdd0477](https://github.com/nfroidure/whook/commit/bdd0477912a55466d5760b984edc2fa172c2b67a)), closes [#30](https://github.com/nfroidure/whook/issues/30)
* **API:** Add some sample endpoints ([0c549fe](https://github.com/nfroidure/whook/commit/0c549fe9524aacd5e64eacc61aec9b45e0e45b34))
* **Authentication:** Add authentication wrapper ([a956ec2](https://github.com/nfroidure/whook/commit/a956ec21f0b97027b9ecc9a7ea5aa5b6174fec40)), closes [#18](https://github.com/nfroidure/whook/issues/18)
* **CLI:** Add the Whook CLI tool ([5511747](https://github.com/nfroidure/whook/commit/55117470c876d0b2b0412a8d5346885075b81e26)), closes [#12](https://github.com/nfroidure/whook/issues/12)
* **core:** add support for esm ([92c56cb](https://github.com/nfroidure/whook/commit/92c56cb1a0881ab34d1721446150e32c8db6bf8a)), closes [#68](https://github.com/nfroidure/whook/issues/68)
* **create-whook:** Add a `putEcho` handler for demo ([559c4ad](https://github.com/nfroidure/whook/commit/559c4ad3c1402ce48037b4128fd685e8467034e8))
* **create-whook:** Add an error example ([6557662](https://github.com/nfroidure/whook/commit/6557662243255d0fac291b502edcd8431c884d02))
* **example:** Move the example server ([a271520](https://github.com/nfroidure/whook/commit/a271520aaebfb0592c3d6b10d1cd69d9250d63ec))
* **Lerna:** Setup Whook as a monorepo ([395d8b4](https://github.com/nfroidure/whook/commit/395d8b4917e48b115cf131af7336f6e445bffad2))
* **Mermaid:** Allow to print Mermaid graphs ([ee38ceb](https://github.com/nfroidure/whook/commit/ee38cebfd5e3b7d038d6fdb28219bf06b86921cd))
* **Plugins:** Allow to use plugins in autoloaders ([46ff705](https://github.com/nfroidure/whook/commit/46ff705d5d6e21fc6992ce73c8509909d3fb95a5)), closes [#11](https://github.com/nfroidure/whook/issues/11)
* **swaggerui:** add mutedParameters option ([88c6176](https://github.com/nfroidure/whook/commit/88c6176e8d55359c4adabce4e04cf5d5521113fb))
* **whook-swagger-ui:** Add a `getOpenAPI` endpoint ([f2b9853](https://github.com/nfroidure/whook/commit/f2b98537a543e03293b1fe51738323e5d334ea6c))



