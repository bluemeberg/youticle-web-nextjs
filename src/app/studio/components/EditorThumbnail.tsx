import { timeAgo } from "@/utils/formatter";
import styled from "styled-components";

interface EditorThumbnailProps {
  image: string; // 에디터 이미지 경로
  name: string; // 에디터 이름
  date: string; // 업로드 날짜
}

const EditorThumbnail: React.FC<EditorThumbnailProps> = ({
  image,
  name,
  date,
}) => {
  return (
    <ThumbnailContainer>
      <ThumbnailWrapper>
        <ThumbnailImage src={image} alt={`${name} Thumbnail`} />
        <EditorLabel>에디터</EditorLabel>
      </ThumbnailWrapper>
      <TextContainer>
        <EditorName>{name}</EditorName>
        <UploadTime>{timeAgo(date)}에 업로드하였습니다.</UploadTime>
      </TextContainer>
    </ThumbnailContainer>
  );
};

export default EditorThumbnail;

// 스타일 정의
const ThumbnailContainer = styled.div`
  display: flex;
  align-items: center;
  padding-top: 32px;
  margin-left: 16px;
  gap: 12px; /* 썸네일과 텍스트 사이 여백 */
  margin-bottom: 16px;
`;

const ThumbnailWrapper = styled.div`
  position: relative;
`;

const ThumbnailImage = styled.img`
  width: 48px; /* 에디터 썸네일 크기를 약간 키움 */
  height: 48px;
  border-radius: 50%; /* 둥근 썸네일 */
  object-fit: cover;
  border: 2px solid #ddd;
  background-color: #f0f0f0;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const EditorLabel = styled.span`
  position: absolute;
  bottom: -6px;
  right: -6px;
  background-color: #007bff; /* 강조된 파란색 */
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 6px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const EditorName = styled.span`
  font-size: 16px; /* 폰트 크기 증가 */
  font-weight: 700;
  color: #222;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const UploadTime = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #666;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;
