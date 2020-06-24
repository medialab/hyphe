FROM python:3.7.6-slim
COPY .  /text_indexation
WORKDIR /text_indexation/test
RUN pip install -r requirements.txt
ENTRYPOINT ["pytest", "-s"]