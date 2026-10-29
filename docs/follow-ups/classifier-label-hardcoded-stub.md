# 분류기를 바꿔도 접수 기록의 classifier가 항상 "stub"으로 저장된다

**Symptom**: `prepareComplaint`에 다른 분류 함수를 넘겨도 저장 기록의 `classifier`가 "stub"이다. 분류 실패 시 대체 기록도 마찬가지다.

**Observed evidence**: [features/complaints/prepare.ts](../../features/complaints/prepare.ts)에 "stub" 문자열이 두 곳에 고정되어 있다. 코드 검토(`code-review low`)에서 지적됨. AI 모델이 아직 없어 실제 발생하지는 않았다.

**Suspected cause**: 첫 구현이 임시 분류기만 있어 분류기 식별자를 인자로 받지 않았다.

**What was tried**: 없음. 현재는 모든 접수가 임시 분류기 결과라 표시가 정확하다.

**Proposed next step**: AI 모델 분류기를 붙일 때 분류기가 자신의 식별자를 돌려주게 하고, 접수 기록과 "임시 분류" 표시가 그 값을 따르게 한다.
