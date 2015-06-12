FROM java:openjdk-6-jdk


ENV THRIFT_VERSION 0.8.0


# Install Maven

RUN apt-get update \
  && apt-get install curl build-essential maven2 ant -y --no-install-recommends

# Install Thrift

RUN curl -sSl http://archive.apache.org/dist/thrift/${THRIFT_VERSION}/thrift-${THRIFT_VERSION}.tar.gz \
  | tar xzf - \
  && cd thrift-${THRIFT_VERSION} \
  && ./configure --with-java --without-erlang --without-php \
  && make \
  && make install


# Copy the memory structure to

WORKDIR /app/memory_structure
COPY ./ ./


# Generate Java API

RUN set -e \
  && cd ./src/main/java \
  && thrift -gen java memorystructure.thrift || exit 1 \
  && mv -f gen-java/fr/sciencespo/medialab/hci/memorystructure/thrift/* fr/sciencespo/medialab/hci/memorystructure/thrift \
  && rm -rf gen-java


# Compile Lucene

RUN mvn -Dmaven.test.skip=true clean install


# Generate Python API

RUN set -x \
  && mkdir -p /app/hyphe_backend/memorystructure \
  && thrift -gen py ./src/main/java/memorystructure.thrift || exit 1 \
  && cp -r ./gen-py/memorystructure/* /app/hyphe_backend/memorystructure \
  && mv ./target/MemoryStructureExecutable.jar /app/hyphe_backend/memorystructure \
  && rm -rf gen-py


# Data-only container

VOLUME ["/app/memory_structure", "/app/hyphe_backend/memorystructure"]

CMD ["true"]
