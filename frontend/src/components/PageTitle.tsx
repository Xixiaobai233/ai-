import { Helmet } from 'react-helmet-async';

interface PageTitleProps {
  title: string;
}

const BASE = 'AI 任务管理';

export default function PageTitle({ title }: PageTitleProps) {
  return (
    <Helmet>
      <title>{title} — {BASE}</title>
    </Helmet>
  );
}
