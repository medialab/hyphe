FROM python:3.5

COPY . /hyphe_text_indexation
WORKDIR /hyphe_text_indexation

RUN ["chmod", "+x", "./install_deps.sh"]
RUN ["./install_deps.sh"]

ENTRYPOINT ["python", "text_indexation.py"]