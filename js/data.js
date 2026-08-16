/**
 * Momentboard — leaderboard data
 * Temporal sentence grounding / video moment retrieval benchmarks.
 *
 * Numbers are as reported in the source papers (see sources.json / About page).
 * Primary sources for the comparison tables:
 *   - VideoMind benchmark doc (github.com/yeliudev/VideoMind, docs/BENCHMARK.md)
 *   - R2-Tuning paper, Table 2 (arXiv:2404.00801)
 * Some values differ slightly across papers due to evaluation settings;
 * the About page lists per-benchmark sources.
 */

window.LEADERBOARD_DATA = {
  "updated": "2026-08-16",
  "methods": {
    "2d-tan": {
      "title": "Learning 2D Temporal Adjacent Networks for Moment Localization with Natural Language",
      "venue": "AAAI", "year": 2020, "arxiv": "1912.03590"
    },
    "vslnet": {
      "title": "Span-based Localizing Network for Natural Language Video Localization",
      "venue": "ACL", "year": 2021, "arxiv": "2004.13931"
    },
    "mmn": {
      "title": "Fast Video Moment Retrieval",
      "venue": "ICCV", "year": 2021
    },
    "moment-detr": {
      "title": "QVHighlights: Detecting Moments and Highlights in Videos via Natural Language Queries",
      "venue": "NeurIPS (D&B)", "year": 2021, "arxiv": "2107.09609"
    },
    "umt": {
      "title": "UMT: Unified Multi-modal Transformers for Joint Video Moment Retrieval and Highlight Detection",
      "venue": "NAACL", "year": 2022, "arxiv": "2203.12745"
    },
    "momentdiff": {
      "title": "MomentDiff: Generative Video Moment Retrieval from Random to Real",
      "venue": "ECCV", "year": 2023, "arxiv": "2307.02869"
    },
    "qd-detr": {
      "title": "Query-Dependent Video Representation for Moment Retrieval and Highlight Detection",
      "venue": "CVPR", "year": 2023, "arxiv": "2303.13874"
    },
    "univtg": {
      "title": "UniVTG: Towards Unified Video-Language Temporal Grounding",
      "venue": "ICCV", "year": 2023, "arxiv": "2307.16715"
    },
    "r2-tuning": {
      "title": "R2-Tuning: Efficient Image-to-Video Transfer Learning for Video Temporal Grounding",
      "venue": "ECCV", "year": 2024, "arxiv": "2404.00801"
    },
    "videomind": {
      "title": "VideoMind: A Chain-of-LoRA Agent for Temporal-Grounded Video Reasoning",
      "venue": "arXiv", "year": 2025, "arxiv": "2503.13444"
    },
    "vtime-llm": {
      "title": "VTimeLLM: Empower LLM to Grasp Video Moments",
      "venue": "NeurIPS", "year": 2024, "arxiv": "2311.18445"
    },
    "timechat": {
      "title": "TimeChat: A Time-sensitive Multimodal Large Language Model for Long Video Understanding",
      "venue": "CVPR", "year": 2024, "arxiv": "2312.02051"
    },
    "momentor": {
      "title": "Momentor: Advancing Video Large Language Model with Fine-Grained Temporal Reasoning",
      "venue": "CVPR", "year": 2024, "arxiv": "2402.11435"
    },
    "hawkeye": {
      "title": "HawkEye: Training Video-Text LLMs for Grounding Text in Videos",
      "venue": "ECCV", "year": 2024, "arxiv": "2403.10228"
    },
    "chatvtg": {
      "title": "ChatVTG: Video Temporal Grounding via Chat with Video Dialogue Large Language Models",
      "venue": "CVPRW (PVUW)", "year": 2024, "arxiv": "2410.12813"
    },
    "videochat-tpo": {
      "title": "Temporal Preference Optimization for Long-Form Video Understanding",
      "venue": "arXiv", "year": 2025, "arxiv": "2501.13919"
    },
    "et-chat": {
      "title": "E.T. Bench: Towards Open-Ended Event-Level Video-Language Understanding",
      "venue": "arXiv", "year": 2024, "arxiv": "2409.18111"
    },
    "xml": {
      "title": "TVR: A Large-Scale Dataset for Video-Subtitle Moment Retrieval",
      "venue": "ECCV", "year": 2020, "arxiv": "2001.09099"
    },
    "videochat": {
      "title": "VideoChat: Chat-Centric Video Understanding",
      "venue": "arXiv", "year": 2023, "arxiv": "2305.06355"
    },
    "video-llama": {
      "title": "Video-LLaMA: An Instruction-tuned Audio-Visual Language Model for Video Understanding",
      "venue": "arXiv", "year": 2023, "arxiv": "2306.02858"
    },
    "video-chatgpt": {
      "title": "Video-ChatGPT: Towards Detailed Video Understanding via Large Vision and Language Models",
      "venue": "arXiv", "year": 2023, "arxiv": "2306.05424"
    },
    "valley": {
      "title": "Valley: Video Assistant with Large Language model Enhanced abilitY",
      "venue": "arXiv", "year": 2023, "arxiv": "2306.07207"
    }
  },
  "benchmarks": [
    {
      "id": "qvhighlights",
      "name": "QVHighlights",
      "task": "Moment retrieval + highlight detection",
      "split": "test",
      "dataset": {
        "name": "QVHighlights",
        "title": "QVHighlights: Detecting Moments and Highlights in Videos via Natural Language Queries",
        "venue": "NeurIPS 2021 (Datasets & Benchmarks)",
        "arxiv": "2107.09609",
        "year": 2021
      },
      "metrics": [
        { "id": "r1@0.5", "label": "R1@0.5", "group": "Moment retrieval", "primary": true },
        { "id": "r1@0.7", "label": "R1@0.7", "group": "Moment retrieval" },
        { "id": "map@0.5", "label": "mAP@0.5", "group": "Highlight detection" },
        { "id": "map@0.75", "label": "mAP@0.75", "group": "Highlight detection" },
        { "id": "map-avg", "label": "mAP Avg", "group": "Highlight detection" }
      ],
      "rows": [
        { "method": "xml", "values": { "r1@0.5": 41.83, "r1@0.7": 30.35, "map@0.5": 44.63, "map@0.75": 31.73, "map-avg": 32.14 } },
        { "method": "xml", "name": "XML+", "values": { "r1@0.5": 46.69, "r1@0.7": 33.46, "map@0.5": 47.89, "map@0.75": 34.67, "map-avg": 34.90 } },
        { "method": "moment-detr", "values": { "r1@0.5": 59.78, "r1@0.7": 40.33, "map@0.5": 60.51, "map@0.75": 35.36, "map-avg": 36.14 } },
        { "method": "umt", "values": { "r1@0.5": 60.83, "r1@0.7": 43.26, "map@0.5": 57.33, "map@0.75": 39.12, "map-avg": 38.08 } },
        { "method": "momentdiff", "values": { "r1@0.5": 58.21, "r1@0.7": 41.48, "map@0.5": 54.57, "map@0.75": 37.21, "map-avg": 36.84 } },
        { "method": "qd-detr", "values": { "r1@0.5": 62.40, "r1@0.7": 44.98, "map@0.5": 62.52, "map@0.75": 39.88, "map-avg": 39.86 } },
        { "method": "univtg", "values": { "r1@0.5": 65.43, "r1@0.7": 50.06, "map@0.5": 64.06, "map@0.75": 45.02, "map-avg": 43.63 } },
        { "method": "r2-tuning", "values": { "r1@0.5": 68.03, "r1@0.7": 49.35, "map@0.5": 69.04, "map@0.75": 47.56, "map-avg": 46.17 } },
        { "method": "videomind", "size": "2B", "setting": "fine-tuned", "values": { "r1@0.5": 75.42, "r1@0.7": 59.35, "map@0.5": 74.11, "map@0.75": 55.15, "map-avg": 51.60 } },
        { "method": "videomind", "size": "7B", "setting": "fine-tuned", "values": { "r1@0.5": 78.53, "r1@0.7": 61.09, "map@0.5": 76.07, "map@0.75": 58.17, "map-avg": 54.19 } }
      ]
    },
    {
      "id": "charades-sta",
      "name": "Charades-STA",
      "task": "Temporal sentence grounding",
      "split": "test",
      "dataset": {
        "name": "Charades-STA",
        "title": "Read, Watch, and Move: Reinforcement Learning for Temporally Grounding Natural Language Descriptions in Videos",
        "venue": "ICCV 2017",
        "arxiv": "1705.02101",
        "year": 2017
      },
      "metrics": [
        { "id": "r@0.3", "label": "R@0.3", "group": "Recall", "primary": false },
        { "id": "r@0.5", "label": "R@0.5", "group": "Recall", "primary": true },
        { "id": "r@0.7", "label": "R@0.7", "group": "Recall" },
        { "id": "miou", "label": "mIoU", "group": "Localization" }
      ],
      "rows": [
        { "method": "2d-tan", "values": { "r@0.3": 58.76, "r@0.5": 46.02, "r@0.7": 27.50, "miou": 41.25 } },
        { "method": "vslnet", "values": { "r@0.3": 60.30, "r@0.5": 42.69, "r@0.7": 24.14, "miou": 41.58 } },
        { "method": "moment-detr", "values": { "r@0.3": 65.83, "r@0.5": 52.07, "r@0.7": 30.59, "miou": 45.54 } },
        { "method": "umt", "values": { "r@0.5": 48.3, "r@0.7": 29.3 } },
        { "method": "univtg", "values": { "r@0.3": 70.81, "r@0.5": 58.01, "r@0.7": 35.65, "miou": 50.10 } },
        { "method": "r2-tuning", "values": { "r@0.3": 70.91, "r@0.5": 59.78, "r@0.7": 37.02, "miou": 50.86 } },
        { "method": "vtime-llm", "size": "13B", "setting": "zero-shot", "values": { "r@0.3": 55.3, "r@0.5": 34.3, "r@0.7": 14.7, "miou": 34.6 } },
        { "method": "timechat", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 51.5, "r@0.5": 32.2, "r@0.7": 13.4 } },
        { "method": "momentor", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 42.6, "r@0.5": 26.6, "r@0.7": 11.6, "miou": 28.5 } },
        { "method": "hawkeye", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 50.6, "r@0.5": 31.4, "r@0.7": 14.5, "miou": 33.7 } },
        { "method": "chatvtg", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 52.7, "r@0.5": 33.0, "r@0.7": 15.9, "miou": 34.9 } },
        { "method": "videochat-tpo", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 58.3, "r@0.5": 40.2, "r@0.7": 18.4, "miou": 38.1 } },
        { "method": "et-chat", "size": "4B", "setting": "zero-shot", "values": { "r@0.3": 65.7, "r@0.5": 45.9, "r@0.7": 20.0, "miou": 42.3 } },
        { "method": "videomind", "size": "2B", "setting": "zero-shot", "values": { "r@0.3": 67.6, "r@0.5": 51.1, "r@0.7": 26.0, "miou": 45.2 } },
        { "method": "videomind", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 73.5, "r@0.5": 59.1, "r@0.7": 31.2, "miou": 50.2 } }
      ]
    },
    {
      "id": "activitynet-captions",
      "name": "ActivityNet-Captions",
      "task": "Temporal sentence grounding",
      "split": "val_2",
      "dataset": {
        "name": "ActivityNet-Captions",
        "title": "Dense-Captioning Events in Videos",
        "venue": "ICCV 2017",
        "arxiv": "1705.00754",
        "year": 2017
      },
      "metrics": [
        { "id": "r@0.3", "label": "R@0.3", "group": "Recall" },
        { "id": "r@0.5", "label": "R@0.5", "group": "Recall", "primary": true },
        { "id": "r@0.7", "label": "R@0.7", "group": "Recall" },
        { "id": "miou", "label": "mIoU", "group": "Localization" }
      ],
      "rows": [
        { "method": "2d-tan", "values": { "r@0.3": 60.4, "r@0.5": 43.4, "r@0.7": 25.0, "miou": 42.5 } },
        { "method": "mmn", "values": { "r@0.3": 64.5, "r@0.5": 48.2, "r@0.7": 29.4, "miou": 46.6 } },
        { "method": "videochat", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 8.8, "r@0.5": 3.7, "r@0.7": 1.5, "miou": 7.2 } },
        { "method": "video-llama", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 6.9, "r@0.5": 2.1, "r@0.7": 0.8, "miou": 6.5 } },
        { "method": "video-chatgpt", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 26.4, "r@0.5": 13.6, "r@0.7": 6.1, "miou": 18.9 } },
        { "method": "valley", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 30.6, "r@0.5": 13.7, "r@0.7": 8.1, "miou": 21.9 } },
        { "method": "chatvtg", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 40.7, "r@0.5": 22.5, "r@0.7": 9.4, "miou": 27.2 } },
        { "method": "momentor", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 42.9, "r@0.5": 23.0, "r@0.7": 12.4, "miou": 29.3 } },
        { "method": "et-chat", "size": "4B", "setting": "zero-shot", "values": { "r@0.3": 24.1, "r@0.5": 12.8, "r@0.7": 6.1, "miou": 18.9 } },
        { "method": "videomind", "size": "2B", "setting": "zero-shot", "values": { "r@0.3": 44.0, "r@0.5": 26.5, "r@0.7": 12.6, "miou": 30.1 } },
        { "method": "videomind", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 48.4, "r@0.5": 30.3, "r@0.7": 15.7, "miou": 33.3 } }
      ]
    },
    {
      "id": "tacos",
      "name": "TACoS",
      "task": "Temporal sentence grounding",
      "split": "test",
      "dataset": {
        "name": "TACoS",
        "title": "Grounding Action Descriptions in Videos",
        "venue": "ACL 2013",
        "url": "https://aclanthology.org/Q13-1003/",
        "year": 2013
      },
      "metrics": [
        { "id": "r@0.3", "label": "R@0.3", "group": "Recall" },
        { "id": "r@0.5", "label": "R@0.5", "group": "Recall", "primary": true },
        { "id": "r@0.7", "label": "R@0.7", "group": "Recall" },
        { "id": "miou", "label": "mIoU", "group": "Localization" }
      ],
      "rows": [
        { "method": "2d-tan", "values": { "r@0.3": 40.0, "r@0.5": 28.0, "r@0.7": 12.9, "miou": 27.2 } },
        { "method": "vslnet", "values": { "r@0.3": 35.5, "r@0.5": 23.5, "r@0.7": 13.1, "miou": 25.0 } },
        { "method": "moment-detr", "values": { "r@0.3": 38.0, "r@0.5": 24.7, "r@0.7": 12.0, "miou": 25.5 } },
        { "method": "univtg", "values": { "r@0.3": 51.4, "r@0.5": 35.0, "r@0.7": 17.4, "miou": 33.6 } },
        { "method": "r2-tuning", "values": { "r@0.3": 49.7, "r@0.5": 38.7, "r@0.7": 25.1, "miou": 35.9 } },
        { "method": "videomind", "size": "2B", "setting": "fine-tuned", "values": { "r@0.3": 38.6, "r@0.5": 26.9, "r@0.7": 15.5, "miou": 27.4 } },
        { "method": "videomind", "size": "7B", "setting": "fine-tuned", "values": { "r@0.3": 49.5, "r@0.5": 36.2, "r@0.7": 21.4, "miou": 34.4 } }
      ]
    },
    {
      "id": "ego4d-nlq",
      "name": "Ego4D-NLQ",
      "task": "Natural language queries (egocentric)",
      "split": "val",
      "dataset": {
        "name": "Ego4D-NLQ",
        "title": "Ego4D: Around the World in 3,000 Hours of Egocentric Video",
        "venue": "CVPR 2022",
        "arxiv": "2110.07058",
        "year": 2022
      },
      "metrics": [
        { "id": "r@0.3", "label": "R@0.3", "group": "Recall" },
        { "id": "r@0.5", "label": "R@0.5", "group": "Recall", "primary": true },
        { "id": "r@0.7", "label": "R@0.7", "group": "Recall" },
        { "id": "miou", "label": "mIoU", "group": "Localization" }
      ],
      "rows": [
        { "method": "2d-tan", "setting": "fine-tuned", "values": { "r@0.3": 4.3, "r@0.5": 1.8, "r@0.7": 0.6, "miou": 3.4 } },
        { "method": "vslnet", "setting": "fine-tuned", "values": { "r@0.3": 4.5, "r@0.5": 2.4, "r@0.7": 1.0, "miou": 3.5 } },
        { "method": "moment-detr", "setting": "fine-tuned", "values": { "r@0.3": 4.3, "r@0.5": 1.8, "r@0.7": 0.7, "miou": 3.5 } },
        { "method": "univtg", "setting": "fine-tuned", "values": { "r@0.3": 7.3, "r@0.5": 4.0, "r@0.7": 1.3, "miou": 4.9 } },
        { "method": "r2-tuning", "setting": "fine-tuned", "values": { "r@0.3": 7.2, "r@0.5": 4.5, "r@0.7": 2.1, "miou": 4.9 } },
        { "method": "univtg", "name": "UniVTG*", "setting": "zero-shot", "note": "zero-shot, no NLQ pretraining", "values": { "r@0.3": 6.5, "r@0.5": 3.5, "r@0.7": 1.2, "miou": 4.6 } },
        { "method": "videomind", "size": "2B", "setting": "zero-shot", "values": { "r@0.3": 5.9, "r@0.5": 2.9, "r@0.7": 1.2, "miou": 4.7 } },
        { "method": "videomind", "size": "7B", "setting": "zero-shot", "values": { "r@0.3": 7.2, "r@0.5": 3.7, "r@0.7": 1.7, "miou": 5.4 } }
      ]
    }
  ],
  "imported": []
};
