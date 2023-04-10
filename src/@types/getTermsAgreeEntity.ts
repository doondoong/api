export interface SelectAgreeCursor {
  AGREE_SEQNO: number;
  SERVICE_DIV: string;
  TERMS_INFO_NO: number;
  TERMS_REGNO: number;
  TERMS_TITLE: string;
  AGREE_YN: string;
  ETC_INFO: string;
  AGREE_DATE: string;
  AGREE_UCODE: string;
  AGREE_IPADDR: string;
  CHECK?: boolean;
  ESSENTIAL_YN?: string;
  ip?: string | string[];
}

export interface SelectAgree extends SelectAgreeCursor {
  out_retCode: string;
  out_retMsg: string;
  out_termsAgreeList: SelectAgreeCursor;
}
