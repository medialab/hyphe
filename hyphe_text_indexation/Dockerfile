FROM python:3.5

COPY . /hyphe_text_indexation
WORKDIR /hyphe_text_indexation
RUN sh install_deps.sh
RUN chmod u+x liveTextIndexation.py
RUN chmod +x ./wait-for-elasticsearch.sh


CMD ["python","/hyphe_text_indexation/liveTextIndexation.py"]
#CMD ["./wait-for-elasticsearch.sh", "http://elasticsearch:9200", "--", "python", "./liveTextIndexation.py"]