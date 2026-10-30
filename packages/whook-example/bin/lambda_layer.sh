mkdir -p layer/nodejs;
cp package.json layer/nodejs/package.json;
cp package-lock.json layer/nodejs/package-lock.json;
docker run --entrypoint "" -v "$PWD/layer/nodejs":/var/task "public.ecr.aws/lambda/nodejs:20" /bin/sh -c "
  dnf update;
  dnf install -y gcc gcc-c++ make;
  mkdir .npm;
  HOME=$(pwd);
  npm i --production;
  rm -rf .npm;
  exit";
env --chdir "$PWD/layer" zip -r "$PWD/layer/lambda_layer.zip" .;
docker run --entrypoint "" -v "$PWD/layer/nodejs":/var/task "public.ecr.aws/lambda/nodejs:20" /bin/sh -c "rm -rf node_modules; exit";
rm -rf layer/nodejs;
