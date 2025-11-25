FROM docker.redpanda.com/redpandadata/console:latest

# Copy console configuration
COPY ./console-config.yml /tmp/console-config.yml

# Expose console port
EXPOSE 8080

# Environment variables should be passed at runtime:
# - CONFIG_FILEPATH=/tmp/console-config.yml
# - KAFKA_BROKERS
# - KAFKA_SASL_USERNAME
# - KAFKA_SASL_PASSWORD
# - KAFKA_SASL_MECHANISM=SCRAM-SHA-256
# - REDPANDA_ADMINAPI_AUTHENTICATION_BASIC_USERNAME
# - REDPANDA_ADMINAPI_AUTHENTICATION_BASIC_PASSWORD
# - AUTHENTICATION_JWTSIGNINGKEY

# Run with:
# docker build -f console.Dockerfile -t redpanda-console .
# docker run -p 8080:8080 --network databuddy \
#   -e CONFIG_FILEPATH=/tmp/console-config.yml \
#   -e KAFKA_BROKERS=${REDPANDA_BROKER} \
#   -e KAFKA_SASL_USERNAME=${REDPANDA_USER} \
#   -e KAFKA_SASL_PASSWORD=${REDPANDA_PASSWORD} \
#   -e KAFKA_SASL_MECHANISM=SCRAM-SHA-256 \
#   -e REDPANDA_ADMINAPI_AUTHENTICATION_BASIC_USERNAME=${REDPANDA_USER} \
#   -e REDPANDA_ADMINAPI_AUTHENTICATION_BASIC_PASSWORD=${REDPANDA_PASSWORD} \
#   -e AUTHENTICATION_JWTSIGNINGKEY=${CONSOLE_JWT_SIGNING_KEY} \
#   redpanda-console

