from core.settings import settings
from langchain_groq import ChatGroq
from pydantic import SecretStr

def get_llm(response_format=None):
    model = ChatGroq(
        api_key=SecretStr(settings.groq_api_key),
        model=settings.groq_model,
    )
    if response_format:
        return model.with_structured_output(response_format, method="json_schema", )
    return model


# def get_llm(response_format=None):
#     model = ChatGoogleGenerativeAI(
#         api_key=SecretStr(settings.gemini_api_key),
#         model=settings.gemini_model,

#     )
#     if response_format:
#         return model.with_structured_output(response_format, method="json_schema", )
#     return model